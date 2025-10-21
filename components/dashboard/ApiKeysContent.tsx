"use client";

import { useEffect, useState } from "react";
import useSWR from 'swr'
import { FiCopy, FiEye, FiEyeOff, FiPlus, FiTrash2, FiKey, FiTerminal, FiCode } from "react-icons/fi";
import { FaApple, FaWindows, FaLinux } from "react-icons/fa";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import { useConfirm } from "@/hooks/useConfirm";
import ConfirmDialog from "@/components/ConfirmDialog";

type GuideTab = "windows" | "macos" | "linux";
type GuideKind = "claude" | "codex" | "gemini" | null;

// localStorage 辅助函数
const STORAGE_KEY = 'apikeys_fullkey_cache';

function saveFullKeyToStorage(id: string, fullKey: string) {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    const data = cached ? JSON.parse(cached) : {};
    data[id] = fullKey;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save fullKey to localStorage:', error);
  }
}

function loadFullKeysFromStorage(): Record<string, string> {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Failed to load fullKeys from localStorage:', error);
    return {};
  }
}

function removeFullKeyFromStorage(id: string) {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      delete data[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Failed to remove fullKey from localStorage:', error);
  }
}

export default function ApiKeysContent() {
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const isTestEnv = typeof process !== 'undefined' && !!(process as any).env?.JEST_WORKER_ID
  // 使用 ref 来持久化存储 fullKey，避免被 SWR 重新获取数据时覆盖
  // 初始化时从 localStorage 加载
  const fullKeyCacheRef = useState<React.MutableRefObject<Record<string, string>>>(() => {
    const stored = loadFullKeysFromStorage();
    return { current: stored };
  })[0]

  const { data: apiKeysResp, mutate: mutateKeys, isLoading } = useSWR(
    '/api/apikeys',
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch API keys')
      const data = await res.json()

      // 合并服务器数据与本地缓存的 fullKey (如果存在)
      // 服务器返回的是脱敏数据,我们需要保留本地已有的 fullKey
      if (data?.apiKeys) {
        data.apiKeys = data.apiKeys.map((key: any) => {
          // 从持久化缓存中恢复 fullKey
          if (fullKeyCacheRef.current[key.id]) {
            return { ...key, fullKey: fullKeyCacheRef.current[key.id] }
          }
          return key
        })
      }

      return data
    },
    // Fetch exactly once on page load, tab focus, or reconnect; no polling/retries
    // Keep deduping small to coalesce duplicate triggers
    {
      revalidateOnMount: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      errorRetryCount: 0,
    }
  )
  const apiKeys = ((apiKeysResp?.apiKeys || []) as any[]).filter((k) => k.status !== 'deleted')
  const [fullKeyMap, setFullKeyMap] = useState<Record<string, string | undefined>>({})
  const [loadingKey, setLoadingKey] = useState<Record<string, boolean>>({})
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyTitle, setNewKeyTitle] = useState("");
  const [activeTab, setActiveTab] = useState<GuideTab>("windows");
  const [installerTab, setInstallerTab] = useState<GuideTab>("windows");
  const [selectedGuide, setSelectedGuide] = useState<GuideKind>(null);
  const { showSuccess, showInfo, showError } = useToast();
  const { t } = useT()
  const { confirmState, showConfirm } = useConfirm();

  // 从 apiKeys 中提取 fullKey (apiKeys 已经在 SWR fetcher 中从 localStorage 恢复了 fullKey)
  const fullKeyMapFromApiKeys = apiKeys.reduce((acc: Record<string, string>, key: any) => {
    if (key.fullKey) {
      acc[key.id] = key.fullKey
    }
    return acc
  }, {})

  // 合并两个来源的 fullKey: state 中的优先
  const mergedFullKeyMap = { ...fullKeyMapFromApiKeys, ...fullKeyMap }

  const activeKeyId = apiKeys.find((k) => k.status === 'active')?.id
  const userApiKey = activeKeyId ? (mergedFullKeyMap[activeKeyId] || "") : ""

  const handleCopyById = async (id: string) => {
    if (!mergedFullKeyMap[id]) {
      await ensureFullKey(id)
    }
    const full = mergedFullKeyMap[id]
    if (!full) return
    navigator.clipboard.writeText(full)
    setCopiedKey(full)
    showSuccess(t('toasts.apiKeyCopied'))
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const ensureFullKey = async (id: string) => {
    if (mergedFullKeyMap[id]) return mergedFullKeyMap[id]
    try {
      setLoadingKey((prev) => ({ ...prev, [id]: true }))
      const res = await fetch(`/api/apikeys/${id}/show`)
      if (!res.ok) {
        let code: string | undefined
        try { const b = await res.json(); code = b?.code } catch {}
        if (code === 'NO_ENCRYPTED_KEY') {
          showError(t('toasts.keyCannotReveal'))
          return undefined
        }
        throw new Error('Failed to load API key')
      }
      const body = await res.json()
      const full = body?.apiKey?.fullKey
      // 存入持久化缓存
      if (full) {
        fullKeyCacheRef.current[id] = full
        // 同时保存到 localStorage 实现永久存储
        saveFullKeyToStorage(id, full)
      }
      setFullKeyMap((prev) => ({ ...prev, [id]: full }))
      return full
    } finally {
      setLoadingKey((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyTitle.trim()) {
      showError(t('toasts.apiKeyTitleRequired'));
      return;
    }
    setCreating(true);
    try {
      // optimistic: add placeholder immediately
      const tempId = `temp-${Date.now()}`
      await mutateKeys((old: any) => ({ apiKeys: [
        { id: tempId, title: newKeyTitle, apiKey: 'creating...', status: 'active', createdAt: new Date().toISOString() },
        ...((old?.apiKeys) || [])
      ] }), false)

      const response = await fetch("/api/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newKeyTitle })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || t('toasts.failedToCreateKey'));
      setShowCreateModal(false);
      setNewKeyTitle("");
      showSuccess(t('toasts.apiKeyCreated'));

      // 将 fullKey 存入持久化缓存（使用 ref，不会被 SWR 重新获取时覆盖）
      if (data.apiKey.fullKey) {
        fullKeyCacheRef.current[data.apiKey.id] = data.apiKey.fullKey
        // 同时保存到 localStorage 实现永久存储
        saveFullKeyToStorage(data.apiKey.id, data.apiKey.fullKey)
      }

      // replace temp with real, and store fullKey in cache
      await mutateKeys((old: any) => ({ apiKeys: [
        {
          id: data.apiKey.id,
          title: data.apiKey.title,
          apiKey: data.apiKey.apiKey,
          fullKey: data.apiKey.fullKey, // 将完整密钥存入 SWR 缓存
          status: data.apiKey.status,
          createdAt: data.apiKey.createdAt
        },
        ...((old?.apiKeys || []).filter((k: any) => k.id !== tempId))
      ] }), false)
      // cache fullKey locally for copy/reveal
      setFullKeyMap((prev) => ({ ...prev, [data.apiKey.id]: data.apiKey.fullKey }))
      // ensure server truth after success (skip during tests to keep snapshots stable)
      if (!isTestEnv) {
        await mutateKeys(undefined, true)
      }
    } catch (e: any) {
      console.error("Error creating API key", e);
      showError(e.message || "Failed to create API key");
      // rollback temp
      await mutateKeys((old: any) => ({ apiKeys: (old?.apiKeys || []).filter((k: any) => !String(k.id).startsWith('temp-')) }), false)
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string, keyTitle: string) => {
    showConfirm(
      `Are you sure you want to delete "${keyTitle}"? This action cannot be undone.`,
      async () => {
        try {
          // optimistic removal
          const prev = apiKeysResp
          await mutateKeys((old: any) => ({ apiKeys: (old?.apiKeys || []).filter((k: any) => k.id !== keyId) }), false)

          const response = await fetch(`/api/apikeys?id=${keyId}`, { method: "DELETE" });
          if (!response.ok) throw new Error(t('toasts.failedToDeleteKey'));
          showSuccess(t('toasts.deletedName', { name: keyTitle }));
          // cleanup local cache
          setFullKeyMap((prev) => { const c = { ...prev }; delete c[keyId]; return c })
          // cleanup persistent cache
          delete fullKeyCacheRef.current[keyId]
          // cleanup localStorage
          removeFullKeyFromStorage(keyId)
          // revalidate from server to confirm deletion
          if (!isTestEnv) {
            await mutateKeys(undefined, true)
          }
        } catch (e) {
          console.error("Error deleting API key", e);
          showError(t('toasts.failedToDeleteKey'));
          // rollback
          await mutateKeys()
        }
      },
      () => showInfo(t('toasts.deletionCancelled'))
    );
  };

  return (
    <div>
      <div className="dashboard-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{t('sidebar.apiKeys') || 'API Keys'}</h1>
            <p style={{ fontSize: 14, color: "#999" }}>{t('dashboard.apiKeys.intro') || 'Manage your API keys for accessing our services'}</p>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0 as any, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, padding: 24, width: "90%", maxWidth: 500 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 20 }}>{t('dashboard.apiKeys.create.title') || 'Create New API Key'}</h3>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 14, color: "#999", marginBottom: 8 }}>{t('dashboard.apiKeys.create.labelTitle') || 'Key Title'}</label>
              <input type="text" value={newKeyTitle} onChange={(e) => setNewKeyTitle(e.target.value)} placeholder={t('dashboard.apiKeys.create.placeholderTitle') || 'e.g., Production Key'} style={{ width: "100%", padding: 10, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#fff", fontSize: 14 }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { setShowCreateModal(false); setNewKeyTitle(""); }} style={{ flex: 1, padding: 10, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#999", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>{t('common.cancel') || 'Cancel'}</button>
              <button onClick={handleCreateKey} disabled={creating || !newKeyTitle.trim()} style={{ flex: 1, padding: 10, background: creating || !newKeyTitle.trim() ? "#333" : "linear-gradient(135deg, #794aff 0%, #b084ff 100%)", border: "none", borderRadius: 6, color: "#fff", fontSize: 14, fontWeight: 500, cursor: creating || !newKeyTitle.trim() ? "not-allowed" : "pointer" }}>{creating ? (t('dashboard.apiKeys.create.creating') || 'Creating...') : (t('dashboard.apiKeys.create.createBtn') || 'Create Key')}</button>
            </div>
          </div>
        </div>
      )}

      {apiKeysResp === undefined ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, color: "#999" }}>{t('dashboard.apiKeys.loading') || 'Loading API keys...'}</div>
      ) : apiKeys.length === 0 ? (
        <div className="balance-card" style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <FiKey style={{ fontSize: 48, color: "#666", marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{t('dashboard.apiKeys.empty.title') || 'No API Keys Yet'}</h3>
          <p style={{ fontSize: 14, color: "#999", marginBottom: 24 }}>{t('dashboard.apiKeys.empty.desc') || 'Create your first API key to start using our services programmatically'}</p>
          <button className="btn" style={{ background: "linear-gradient(135deg, #794aff 0%, #b084ff 100%)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer" }} onClick={() => setShowCreateModal(true)}>
            <FiPlus style={{ marginRight: 8 }} /> {t('dashboard.apiKeys.empty.createFirst') || 'Create Your First Key'}
          </button>
        </div>
      ) : (
        <div className="row">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="col-12 mb-4">
              <div className="api-key-card">
                <div className="api-key-header">
                  <div>
                    <h4 className="api-key-title">{apiKey.title}</h4>
                    <span className={`api-key-status ${apiKey.status === 'active' ? 'active' : 'inactive'}`}>{apiKey.status}</span>
                  </div>
                  <button className="btn-icon" aria-label="Delete API key" onClick={() => handleDeleteKey(apiKey.id, apiKey.title)}>
                    <FiTrash2 />
                  </button>
                </div>
                <div className="api-key-bar">
                  <code className="api-key-code">{showKey[apiKey.id] ? (mergedFullKeyMap[apiKey.id] || 'Loading...') : apiKey.apiKey}</code>
                  <div className="api-key-actions">
              <button className="btn-icon" aria-label={showKey[apiKey.id] ? (t('dashboard.apiKeys.hideKey') || 'Hide API key') : (t('dashboard.apiKeys.revealKey') || 'Reveal API key')} onClick={async () => {
                      if (!showKey[apiKey.id]) {
                        const full = await ensureFullKey(apiKey.id)
                        if (!full) return
                      }
                      setShowKey((prev) => ({ ...prev, [apiKey.id]: !prev[apiKey.id] }))
                    }}>
                      {showKey[apiKey.id] ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <button className="btn-icon" aria-label={t('dashboard.apiKeys.copyKey') || 'Copy API key'} onClick={() => handleCopyById(apiKey.id)}>
                      <FiCopy />
                    </button>
                  </div>
                </div>
                <div className="api-key-footer">
                  <div>
                    <span>{t('dashboard.apiKeys.created') || 'Created'} • </span>
                    <span>{new Date(apiKey.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span>{t('dashboard.apiKeys.status') || 'Status'}: </span>
                    <span className={apiKey.status === 'active' ? 'text-success' : 'text-dim'}>{apiKey.status === 'active' ? (t('dashboard.apiKeys.active') || 'Active') : (t('dashboard.apiKeys.inactive') || 'Inactive')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* One-Click Install - Quick Start */}
      <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, padding: 20, marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 16 }}>⚡ {t('dashboard.apiKeys.quickStart') || 'Quick Start'}</h3>
        {/* Prerequisite: Node.js */}
        <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>{t('dashboard.apiKeys.oneClick.prereqTitle') || 'Before you start — ensure Node.js'}</div>
          <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.oneClick.checkInstalled') || 'Check if installed:'}</p>
          <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
            <code style={{ color: "#00d084" }}>node --version</code>
          </div>
          <p style={{ color: "#aaa", fontSize: 13, margin: 0 }}>{t('dashboard.apiKeys.oneClick.installedOk') || 'If you see a version like v18.0.0, Node.js is installed.'}</p>
          <p style={{ color: "#aaa", fontSize: 13, margin: "6px 0 0 0" }}>{t('dashboard.apiKeys.oneClick.installNode') || 'If not installed, download and install the LTS version from https://nodejs.org, then restart your terminal.'}</p>
        </div>
        {/* OS tabs */}
        <div style={{ display: "flex", gap: 8, borderBottom: "2px solid #1a1a1a", marginBottom: 12 }}>
          <button onClick={() => setInstallerTab("windows")} style={{ background: installerTab === "windows" ? "linear-gradient(135deg, #794aff 0%, #b084ff 100%)" : "transparent", color: installerTab === "windows" ? "#fff" : "#999", border: "none", borderRadius: "8px 8px 0 0", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><FaWindows /> {t('dashboard.apiKeys.tabs.windows') || 'Windows'}</button>
          <button onClick={() => setInstallerTab("macos")} style={{ background: installerTab === "macos" ? "linear-gradient(135deg, #794aff 0%, #b084ff 100%)" : "transparent", color: installerTab === "macos" ? "#fff" : "#999", border: "none", borderRadius: "8px 8px 0 0", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><FaApple /> {t('dashboard.apiKeys.tabs.macos') || 'macOS'}</button>
          <button onClick={() => setInstallerTab("linux")} style={{ background: installerTab === "linux" ? "linear-gradient(135deg, #794aff 0%, #b084ff 100%)" : "transparent", color: installerTab === "linux" ? "#fff" : "#999", border: "none", borderRadius: "8px 8px 0 0", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><FaLinux /> {t('dashboard.apiKeys.tabs.linux') || 'Linux'}</button>
        </div>
        {installerTab === "windows" && (
          <>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>{t('dashboard.apiKeys.oneClick.windowsTitle') || 'Windows'}</div>
              <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.oneClick.windowsPowerShell') || 'In PowerShell, run:'}</p>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ color: "#00d084" }}>npx "@koi.codes/koi-installer"</code>
              </div>
              <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.oneClick.windowsCmd') || 'Or in CMD, run:'}</p>
              <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                <code style={{ color: "#00d084" }}>npx @koi.codes/koi-installer</code>
              </div>
              <div style={{ background: "#221a00", border: "1px solid #ffa500", borderRadius: 6, padding: 10, marginTop: 8 }}>
                <div style={{ color: "#ffd27f", fontSize: 12 }}>{t('dashboard.apiKeys.windows.runAsAdmin') || 'If permission issues occur, run PowerShell as Administrator.'}</div>
              </div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>{t('dashboard.apiKeys.oneClick.startTitle') || 'Start Using'}</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 240px" }}>
                  <div style={{ color: "#999", marginBottom: 6 }}>claude</div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>claude</code>
                  </div>
                </div>
                <div style={{ flex: "1 1 240px" }}>
                  <div style={{ color: "#999", marginBottom: 6 }}>codex</div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>codex</code>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {(installerTab === "macos" || installerTab === "linux") && (
          <>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>{t('dashboard.apiKeys.oneClick.macLinuxTitle') || 'macOS & Linux'}</div>
              <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.oneClick.macLinuxRun') || 'In Terminal, run:'}</p>
              <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                <code style={{ color: "#00d084" }}>npx @koi.codes/koi-installer</code>
              </div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>{t('dashboard.apiKeys.oneClick.startTitle') || 'Start Using'}</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 240px" }}>
                  <div style={{ color: "#999", marginBottom: 6 }}>claude</div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>claude</code>
                  </div>
                </div>
                <div style={{ flex: "1 1 240px" }}>
                  <div style={{ color: "#999", marginBottom: 6 }}>codex</div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>codex</code>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        <div style={{ background: "#121212", borderRadius: 8, padding: 16 }}>
          <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>{t('dashboard.apiKeys.oneClick.uninstallNote') || 'To completely uninstall:'}</div>
          <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
            <code style={{ color: "#00d084" }}>npx @koi.codes/koi-installer uninstall</code>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, padding: 20, marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 16 }}>🛠️ {t('dashboard.apiKeys.manualInstall') || 'Manual Installation'}</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div onClick={() => setSelectedGuide(selectedGuide === "claude" ? null : "claude")} style={{ cursor: "pointer", flex: "1 1 300px", minWidth: 260, background: selectedGuide === "claude" ? "#121212" : "#1a1a1a", border: selectedGuide === "claude" ? "1px solid #794aff" : "1px solid #2a2a2a", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <FiTerminal style={{ color: "#794aff", fontSize: 24 }} />
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>{t('dashboard.apiKeys.cardClaude') || 'Claude Code'}</div>
              <div style={{ color: "#999", fontSize: 12 }}>{t('dashboard.apiKeys.cliSetup') || 'CLI install & setup'}</div>
            </div>
          </div>
          <div onClick={() => setSelectedGuide(selectedGuide === "codex" ? null : "codex")} style={{ cursor: "pointer", flex: "1 1 300px", minWidth: 260, background: selectedGuide === "codex" ? "#121212" : "#1a1a1a", border: selectedGuide === "codex" ? "1px solid #00d084" : "1px solid #2a2a2a", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <FiCode style={{ color: "#00d084", fontSize: 24 }} />
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>{t('dashboard.apiKeys.cardCodex') || 'Codex'}</div>
              <div style={{ color: "#999", fontSize: 12 }}>{t('dashboard.apiKeys.cliSetup') || 'CLI install & setup'}</div>
            </div>
          </div>
          <div onClick={() => setSelectedGuide(selectedGuide === "gemini" ? null : "gemini")} style={{ cursor: "pointer", flex: "1 1 300px", minWidth: 260, background: selectedGuide === "gemini" ? "#121212" : "#1a1a1a", border: selectedGuide === "gemini" ? "1px solid #ff6b00" : "1px solid #2a2a2a", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <FiTerminal style={{ color: "#ff6b00", fontSize: 24 }} />
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>{t('dashboard.apiKeys.cardGemini') || 'Gemini CLI'}</div>
              <div style={{ color: "#999", fontSize: 12 }}>{t('dashboard.apiKeys.cliSetup') || 'CLI install & setup'}</div>
            </div>
          </div>
        </div>

        {selectedGuide === "claude" && (
          <div>
            <div style={{ display: "flex", gap: 8, borderBottom: "2px solid #1a1a1a", marginBottom: 12 }}>
              <button onClick={() => setActiveTab("windows")} style={{ background: activeTab === "windows" ? "linear-gradient(135deg, #794aff 0%, #b084ff 100%)" : "transparent", color: activeTab === "windows" ? "#fff" : "#999", border: "none", borderRadius: "8px 8px 0 0", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><FaWindows /> {t('dashboard.apiKeys.tabs.windows') || 'Windows'}</button>
              <button onClick={() => setActiveTab("macos")} style={{ background: activeTab === "macos" ? "linear-gradient(135deg, #794aff 0%, #b084ff 100%)" : "transparent", color: activeTab === "macos" ? "#fff" : "#999", border: "none", borderRadius: "8px 8px 0 0", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><FaApple /> {t('dashboard.apiKeys.tabs.macos') || 'macOS'}</button>
              <button onClick={() => setActiveTab("linux")} style={{ background: activeTab === "linux" ? "linear-gradient(135deg, #794aff 0%, #b084ff 100%)" : "transparent", color: activeTab === "linux" ? "#fff" : "#999", border: "none", borderRadius: "8px 8px 0 0", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><FaLinux /> {t('dashboard.apiKeys.tabs.linux') || 'Linux'}</button>
            </div>
            {activeTab === "windows" && (
              <>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.installNode') || 'Step 1: Install Node.js'}</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>{t('dashboard.apiKeys.option1Recommended') || 'Option 1 (Recommended): Download the LTS installer from https://nodejs.org, run the installer and follow default steps.'}</p>
                  <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.option2Winget') || 'Option 2 (winget):'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>winget install OpenJS.NodeJS.LTS</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.verifyInstallation') || 'Verify installation:'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>node --version</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.installClaudeCli') || 'Step 2: Install Claude Code CLI'}</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#00d084" }}>npm install -g @anthropic-ai/claude-code</code>
                  </div>
                  <p style={{ color: "#aaa", marginTop: 8 }}>{t('dashboard.apiKeys.windows.runAsAdmin') || 'If permission issues occur, run PowerShell as Administrator.'}</p>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.configureEnv') || 'Step 3: Configure Environment'}</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>{t('dashboard.apiKeys.powershellTemporary') || 'PowerShell (temporary for current session):'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>$env:ANTHROPIC_BASE_URL = "https://koicode.xyz/api"</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>{`$env:ANTHROPIC_AUTH_TOKEN = "${userApiKey || 'Your Token'}"`}</code>
                  </div>
              <p style={{ color: "#ccc", marginTop: 12 }}>{t('dashboard.apiKeys.permanentUserScope') || 'Permanent (user scope):'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>[System.Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://koicode.xyz/api", [System.EnvironmentVariableTarget]::User)</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>{`[System.Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "${userApiKey || 'Your Token'}", [System.EnvironmentVariableTarget]::User)`}</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.getStarted') || 'Step 4: Get Started'}</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#00d084" }}>claude</code>
                  </div>
                </div>
              </>
            )}
            {activeTab === "macos" && (
              <>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.installNode') || 'Step 1: Install Node.js'}</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>{t('dashboard.apiKeys.option1Homebrew') || 'Option 1 (Recommended): Use Homebrew.'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>brew install node</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.option2DownloadPkg') || 'Option 2: Download the LTS installer (.pkg) from https://nodejs.org and follow the instructions.'}</p>
                  <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.verifyInstallation') || 'Verify installation:'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>node --version</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.installClaudeCli') || 'Step 2: Install Claude Code CLI'}</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#00d084" }}>npm install -g @anthropic-ai/claude-code</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>Step 3: Configure Environment</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>{t('dashboard.apiKeys.temporarySession') || 'Temporary (current session):'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>export ANTHROPIC_BASE_URL="https://koicode.xyz/api"</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>{`export ANTHROPIC_AUTH_TOKEN="${userApiKey || 'Your API Token'}"`}</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 12 }}>{t('dashboard.apiKeys.permanentZshOrBash') || 'Permanent (~/.zshrc or ~/.bash_profile):'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>echo 'export ANTHROPIC_BASE_URL="https://koicode.xyz/api"' &gt;&gt; ~/.zshrc</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>{`echo 'export ANTHROPIC_AUTH_TOKEN="${userApiKey || 'Your API Token'}"' >> ~/.zshrc`}</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>source ~/.zshrc</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.getStarted') || 'Step 4: Get Started'}</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#00d084" }}>claude</code>
                  </div>
                </div>
              </>
            )}
            {activeTab === "linux" && (
              <>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.installNode') || 'Step 1: Install Node.js'}</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>{t('dashboard.apiKeys.linux.installHint') || "Use your distribution's package manager, then verify with node --version. Examples:"}</p>
                  <p style={{ color: "#ccc", marginTop: 4 }}>Ubuntu/Debian:</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>sudo apt update &amp;&amp; sudo apt install -y nodejs npm</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 4 }}>Fedora/RHEL/CentOS:</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>sudo dnf install -y nodejs npm</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 4 }}>Arch:</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>sudo pacman -S nodejs npm</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.installClaudeCli') || 'Step 2: Install Claude Code CLI'}</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#00d084" }}>sudo npm install -g @anthropic-ai/claude-code</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.configureEnv') || 'Step 3: Configure Environment'}</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>{t('dashboard.apiKeys.temporarySession') || 'Temporary (current session):'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>export ANTHROPIC_BASE_URL="https://koicode.xyz/api"</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>{`export ANTHROPIC_AUTH_TOKEN="${userApiKey || 'Your API Token'}"`}</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 12 }}>{t('dashboard.apiKeys.permanentBashrc') || 'Permanent (~/.bashrc):'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>echo 'export ANTHROPIC_BASE_URL="https://koicode.xyz/api"' &gt;&gt; ~/.bashrc</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>{`echo 'export ANTHROPIC_AUTH_TOKEN="${userApiKey || 'Your API Token'}"' >> ~/.bashrc`}</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>source ~/.bashrc</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.getStarted') || 'Step 4: Get Started'}</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#00d084" }}>claude</code>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {selectedGuide === "codex" && (
          <div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>{t('dashboard.apiKeys.noteTitle') || 'Usage Note'}</div>
              <p style={{ fontSize: 14, color: "#ccc", margin: 0 }}>{t('dashboard.apiKeys.noteDesc') || 'Your koi.codes API key can be used in both Codex and Claude Code.'}</p>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>{t('dashboard.apiKeys.codex.installTitle') || 'Step 0: Install Codex'}</div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>npm install -g @openai/codex</code>
              </div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>brew install codex</code>
              </div>
              <div style={{ fontSize: 12, color: "#999" }}>{t('dashboard.apiKeys.morePlatforms') || 'For other platforms and troubleshooting, see'} https://github.com/openai/codex</div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>{t('dashboard.apiKeys.codex.step1Title') || 'Step 1: Create auth.json'}</div>
              <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.codex.deleteAuth') || 'Delete any existing auth.json under ~/.codex (if present), then create a new auth.json.'}</p>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>rm ~/.codex/auth.json</code>
              </div>
              <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.codex.createAuth') || 'Then create a new ~/.codex/auth.json with the following content:'}</p>
              <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                <pre style={{ margin: 0 }}><code style={{ fontSize: 14, color: "#00d084" }}>{`{
  "OPENAI_API_KEY": null
}`}</code></pre>
              </div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>{t('dashboard.apiKeys.codex.step2Title') || 'Step 2: Create config.toml'}</div>
              <div style={{ background: "#221a00", border: "1px solid #ffa500", borderRadius: 6, padding: 10, marginBottom: 8 }}>
                <div style={{ color: "#ffa500", fontWeight: 700, marginBottom: 4 }}>{t('dashboard.apiKeys.important') || 'Important'}</div>
                <div style={{ color: "#ffd27f", fontSize: 12 }}>{t('dashboard.apiKeys.codex.configImportantDesc') || 'The config file must be named config.toml and use TOML format. Do not create config.json or other formats.'}</div>
              </div>
              <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.codex.deleteConfig') || 'Delete any existing config.toml under ~/.codex (if present), then create a new config.toml.'}</p>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>rm ~/.codex/config.toml</code>
              </div>
              <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.codex.createConfig') || 'Then create a new ~/.codex/config.toml with the content below:'}</p>
              <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                <pre style={{ margin: 0 }}><code style={{ fontSize: 14, color: "#00d084" }}>{`model_provider = "koi"
model = "gpt-5-codex"
model_reasoning_effort = "high"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.koi]
name = "koi"
base_url = "https://koicode.xyz/openai"  # 根据实际填写你服务器的ip地址或者域名
wire_api = "responses"
requires_openai_auth = true
env_key = "KOI_OPENAI_TOKEN"`}</code></pre>
              </div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>{t('dashboard.apiKeys.codex.step3Title') || 'Step 3: Set Environment Variable'}</div>
              <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.temporarySession') || 'Temporary (current session):'}</p>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>{`export KOI_OPENAI_TOKEN="${userApiKey || 'Your API Token'}"`}</code>
              </div>
              <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.permanentZshOrBash') || 'Permanent (~/.zshrc or ~/.bash_profile):'}</p>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>{`echo 'export KOI_OPENAI_TOKEN="${userApiKey || 'Your API Token'}"' >> ~/.zshrc`}</code>
              </div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>{`echo 'export KOI_OPENAI_TOKEN="${userApiKey || 'Your API Token'}"' >> ~/.bashrc`}</code>
              </div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>source ~/.zshrc</code>
              </div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>source ~/.bashrc</code>
              </div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>{t('dashboard.apiKeys.codex.step4Title') || 'Step 4: Get Started'}</div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>codex</code>
              </div>
            </div>
          </div>
        )}

        {selectedGuide === "gemini" && (
          <div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>{t('dashboard.apiKeys.noteTitle') || 'Usage Note'}</div>
              <p style={{ fontSize: 14, color: "#ccc", margin: 0 }}>{t('dashboard.apiKeys.gemini.noteDesc') || 'Use the same API key as Claude Code.'}</p>
            </div>
            <div style={{ display: "flex", gap: 8, borderBottom: "2px solid #1a1a1a", marginBottom: 12 }}>
              <button onClick={() => setActiveTab("windows")} style={{ background: activeTab === "windows" ? "linear-gradient(135deg, #ff6b00 0%, #ff9500 100%)" : "transparent", color: activeTab === "windows" ? "#fff" : "#999", border: "none", borderRadius: "8px 8px 0 0", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><FaWindows /> {t('dashboard.apiKeys.tabs.windows') || 'Windows'}</button>
              <button onClick={() => setActiveTab("macos")} style={{ background: activeTab === "macos" ? "linear-gradient(135deg, #ff6b00 0%, #ff9500 100%)" : "transparent", color: activeTab === "macos" ? "#fff" : "#999", border: "none", borderRadius: "8px 8px 0 0", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><FaApple /> {t('dashboard.apiKeys.tabs.macos') || 'macOS'}</button>
              <button onClick={() => setActiveTab("linux")} style={{ background: activeTab === "linux" ? "linear-gradient(135deg, #ff6b00 0%, #ff9500 100%)" : "transparent", color: activeTab === "linux" ? "#fff" : "#999", border: "none", borderRadius: "8px 8px 0 0", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><FaLinux /> {t('dashboard.apiKeys.tabs.linux') || 'Linux'}</button>
            </div>
            {activeTab === "windows" && (
              <>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.installNode') || 'Step 1: Install Node.js'}</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>{t('dashboard.apiKeys.option1Recommended') || 'Option 1 (Recommended): Download the LTS installer from https://nodejs.org, run the installer and follow default steps.'}</p>
                  <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.option2Winget') || 'Option 2 (winget):'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>winget install OpenJS.NodeJS.LTS</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.verifyInstallation') || 'Verify installation:'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#ff6b00" }}>node --version</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.gemini.step2Title') || 'Step 2: Install Gemini CLI'}</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#ff6b00" }}>npm install -g @google/gemini-cli</code>
                  </div>
                  <p style={{ color: "#aaa", marginTop: 8 }}>{t('dashboard.apiKeys.windows.runAsAdmin') || 'If permission issues occur, run PowerShell as Administrator.'}</p>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.configureEnv') || 'Step 3: Configure Environment'}</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>{t('dashboard.apiKeys.powershellTemporary') || 'PowerShell (temporary for current session):'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>$env:GOOGLE_GEMINI_BASE_URL = "https://koicode.xyz/gemini"</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>{`$env:GEMINI_API_KEY = "${userApiKey || 'Your API Key'}"`}</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#ff6b00" }}>$env:GEMINI_MODEL = "gemini-2.5-pro"</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 12 }}>{t('dashboard.apiKeys.gemini.powershellPermanent') || 'Permanent (user scope):'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>[System.Environment]::SetEnvironmentVariable("GOOGLE_GEMINI_BASE_URL", "https://koicode.xyz/gemini", [System.EnvironmentVariableTarget]::User)</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>{`[System.Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "${userApiKey || 'Your API Key'}", [System.EnvironmentVariableTarget]::User)`}</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#ff6b00" }}>[System.Environment]::SetEnvironmentVariable("GEMINI_MODEL", "gemini-2.5-pro", [System.EnvironmentVariableTarget]::User)</code>
                  </div>
                  <div style={{ background: "#221a00", border: "1px solid #ffa500", borderRadius: 6, padding: 10, marginTop: 8 }}>
                    <div style={{ color: "#ffd27f", fontSize: 12 }}>{t('dashboard.apiKeys.gemini.permanentNote') || 'After setting, restart PowerShell for changes to take effect.'}</div>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.getStarted') || 'Step 4: Get Started'}</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#ff6b00" }}>gemini</code>
                  </div>
                </div>
              </>
            )}
            {activeTab === "macos" && (
              <>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.installNode') || 'Step 1: Install Node.js'}</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>{t('dashboard.apiKeys.option1Homebrew') || 'Option 1 (Recommended): Use Homebrew.'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>brew install node</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.option2DownloadPkg') || 'Option 2: Download the LTS installer (.pkg) from https://nodejs.org and follow the instructions.'}</p>
                  <p style={{ color: "#ccc", marginTop: 4 }}>{t('dashboard.apiKeys.verifyInstallation') || 'Verify installation:'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#ff6b00" }}>node --version</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.gemini.step2Title') || 'Step 2: Install Gemini CLI'}</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#ff6b00" }}>npm install -g @google/gemini-cli</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.configureEnv') || 'Step 3: Configure Environment'}</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>{t('dashboard.apiKeys.temporarySession') || 'Temporary (current session):'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>export GOOGLE_GEMINI_BASE_URL="https://koicode.xyz/gemini"</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>{`export GEMINI_API_KEY="${userApiKey || 'Your API Key'}"`}</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#ff6b00" }}>export GEMINI_MODEL="gemini-2.5-pro"</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 12 }}>{t('dashboard.apiKeys.permanentZshOrBash') || 'Permanent (~/.zshrc or ~/.bash_profile):'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>echo 'export GOOGLE_GEMINI_BASE_URL="https://koicode.xyz/gemini"' &gt;&gt; ~/.zshrc</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>{`echo 'export GEMINI_API_KEY="${userApiKey || 'Your API Key'}"' >> ~/.zshrc`}</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>echo 'export GEMINI_MODEL="gemini-2.5-pro"' &gt;&gt; ~/.zshrc</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#ff6b00" }}>source ~/.zshrc</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.getStarted') || 'Step 4: Get Started'}</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#ff6b00" }}>gemini</code>
                  </div>
                </div>
              </>
            )}
            {activeTab === "linux" && (
              <>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.installNode') || 'Step 1: Install Node.js'}</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>{t('dashboard.apiKeys.linux.installHint') || "Use your distribution's package manager, then verify with node --version. Examples:"}</p>
                  <p style={{ color: "#ccc", marginTop: 4 }}>Ubuntu/Debian:</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>sudo apt update &amp;&amp; sudo apt install -y nodejs npm</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 4 }}>Fedora/RHEL/CentOS:</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>sudo dnf install -y nodejs npm</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 4 }}>Arch:</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#ff6b00" }}>sudo pacman -S nodejs npm</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.gemini.step2Title') || 'Step 2: Install Gemini CLI'}</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#ff6b00" }}>sudo npm install -g @google/gemini-cli</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.configureEnv') || 'Step 3: Configure Environment'}</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>{t('dashboard.apiKeys.temporarySession') || 'Temporary (current session):'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>export GOOGLE_GEMINI_BASE_URL="https://koicode.xyz/gemini"</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>{`export GEMINI_API_KEY="${userApiKey || 'Your API Key'}"`}</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#ff6b00" }}>export GEMINI_MODEL="gemini-2.5-pro"</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 12 }}>{t('dashboard.apiKeys.permanentBashrc') || 'Permanent (~/.bashrc):'}</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>echo 'export GOOGLE_GEMINI_BASE_URL="https://koicode.xyz/gemini"' &gt;&gt; ~/.bashrc</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>{`echo 'export GEMINI_API_KEY="${userApiKey || 'Your API Key'}"' >> ~/.bashrc`}</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#ff6b00" }}>echo 'export GEMINI_MODEL="gemini-2.5-pro"' &gt;&gt; ~/.bashrc</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#ff6b00" }}>source ~/.bashrc</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>{t('dashboard.apiKeys.step.getStarted') || 'Step 4: Get Started'}</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#ff6b00" }}>gemini</code>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog {...confirmState} />
    </div>
  );
}
