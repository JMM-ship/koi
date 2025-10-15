// A lightweight persisted cache provider for SWR.
// - Persists selected keys to localStorage
// - Respects hard TTL on load; soft TTL is handled by normal SWR revalidation
// - Filters keys by allowlist (string prefix or RegExp)

type AllowRule = string | RegExp;

export interface PersistOptions {
  storageKey?: string;
  version?: string;
  allowlist?: AllowRule[];
  softTtlMs?: number;
  hardTtlMs?: number;
}

interface PersistedEntry<V = any> {
  k: string;
  t: number; // timestamp (ms)
  v: V; // value
}

interface PersistedBlob {
  v: string; // version
  items: PersistedEntry[];
}

const defaultOptions: Required<PersistOptions> = {
  storageKey: '__swr_cache_v1__',
  version: 'v1',
  allowlist: ['/api/referrals/summary', '/api/referrals/invites', '/api/packages/credits', '/api/apikeys', '/api/dashboard'],
  softTtlMs: 5 * 60 * 1000,
  hardTtlMs: 24 * 60 * 60 * 1000,
};

function shouldPersistKey(key: unknown, rules: AllowRule[]): key is string {
  if (typeof key !== 'string') return false;
  return rules.some((rule) =>
    typeof rule === 'string' ? key.startsWith(rule) : (rule as RegExp).test(key)
  );
}

function isSerializable(value: unknown): boolean {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

export function createPersistedSWRProvider(opts?: PersistOptions) {
  const options = { ...defaultOptions, ...(opts || {}) };

  let times = new Map<string, number>();
  let lastData = new Map<string, any>();

  const load = (): Map<any, any> => {
    if (typeof window === 'undefined') return new Map();
    try {
      const raw = window.localStorage.getItem(options.storageKey);
      if (!raw) return new Map();
      const blob: PersistedBlob = JSON.parse(raw);
      if (!blob || blob.v !== options.version || !Array.isArray(blob.items)) return new Map();
      const now = Date.now();
      const m = new Map<any, any>();
      times = new Map();
      for (let { k, t, v } of blob.items) {
        if (!shouldPersistKey(k, options.allowlist)) continue;
        if (now - t > options.hardTtlMs) continue; // drop hard expired
        // SWR stores a state object under the key, typically { data, error, ... }.
        // If the persisted value is a raw fetch result (legacy), wrap it.
        const stateLike = (v && typeof v === 'object' && 'data' in (v as any)) ? v : { data: v };
        m.set(k, stateLike);
        times.set(k, t);
      }
      return m;
    } catch {
      return new Map();
    }
  };

  const save = (cache: Map<any, any>) => {
    if (typeof window === 'undefined') return;
    try {
      const items: PersistedEntry[] = [];
      const now = Date.now();
      lastData.forEach((data, key) => {
        if (!shouldPersistKey(key, options.allowlist)) return;
        if (typeof data === 'undefined') return;
        if (!isSerializable(data)) return;
        const t = times.get(key) || now;
        items.push({ k: key, t, v: { data } });
      })
      const blob: PersistedBlob = { v: options.version, items };
      window.localStorage.setItem(options.storageKey, JSON.stringify(blob));
    } catch {
      // ignore persistence errors
    }
  };

  let saveTimer: number | null = null;
  const scheduleSave = (cache: Map<any, any>) => {
    if (typeof window === 'undefined') return;
    if (saveTimer) window.clearTimeout(saveTimer);
    // small debounce to batch rapid writes
    saveTimer = window.setTimeout(() => {
      save(cache);
      saveTimer = null;
    }, 50);
  };

  return function provider() {
    const cache = load();

    const originalSet = cache.set.bind(cache);
    const originalDelete = cache.delete.bind(cache);
    const originalClear = cache.clear.bind(cache);
    const isTestEnv = typeof process !== 'undefined' && !!(process as any).env?.JEST_WORKER_ID;

    // Override mutating methods to persist
    (cache as any).set = (key: any, value: any) => {
      originalSet(key, value);
      if (shouldPersistKey(key, options.allowlist)) {
        times.set(key, Date.now());
        if (value && typeof value === 'object' && 'data' in (value as any) && typeof (value as any).data !== 'undefined') {
          lastData.set(key, (value as any).data);
        }
        if (isTestEnv) {
          // Persist immediately in test to simplify assertions
          save(cache);
        } else {
          scheduleSave(cache);
        }
      }
      return cache;
    };

    (cache as any).delete = (key: any) => {
      const res = originalDelete(key);
      if (shouldPersistKey(key, options.allowlist)) {
        times.delete(key);
        lastData.delete(key);
        scheduleSave(cache);
      }
      return res;
    };

    (cache as any).clear = () => {
      originalClear();
      times.clear();
    lastData.clear();
      scheduleSave(cache);
    };

    if (typeof window !== 'undefined') {
      const flush = () => save(cache);
      window.addEventListener('beforeunload', flush);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flush();
      });
    }

    return cache as any;
  };
}
