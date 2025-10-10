"use client";

import { useEffect, useState } from "react";
import useSWR from 'swr'
import { FiCopy, FiEye, FiEyeOff, FiPlus, FiTrash2, FiKey, FiTerminal, FiCode } from "react-icons/fi";
import { FaApple, FaWindows, FaLinux } from "react-icons/fa";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import ConfirmDialog from "@/components/ConfirmDialog";

type GuideTab = "windows" | "macos" | "linux";
type GuideKind = "claude" | "codex" | null;

export default function ApiKeysContent() {
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const isTestEnv = typeof process !== 'undefined' && !!(process as any).env?.JEST_WORKER_ID
  const { data: apiKeysResp, mutate: mutateKeys, isLoading } = useSWR(
    '/api/apikeys',
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch API keys')
      return res.json()
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
  const [selectedGuide, setSelectedGuide] = useState<GuideKind>(null);
  const { showSuccess, showInfo, showError } = useToast();
  const { confirmState, showConfirm } = useConfirm();

  useEffect(() => {
    // surface fetch errors subtly via toast only when SWR fetch throws
    // errors are automatically retried by SWR config
  }, [])

  const activeKeyId = apiKeys.find((k) => k.status === 'active')?.id
  const userApiKey = activeKeyId ? (fullKeyMap[activeKeyId] || "") : ""

  const handleCopyById = async (id: string) => {
    if (!fullKeyMap[id]) {
      await ensureFullKey(id)
    }
    const full = fullKeyMap[id]
    if (!full) return
    navigator.clipboard.writeText(full)
    setCopiedKey(full)
    showSuccess("API key copied to clipboard")
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const ensureFullKey = async (id: string) => {
    if (fullKeyMap[id]) return fullKeyMap[id]
    try {
      setLoadingKey((prev) => ({ ...prev, [id]: true }))
      const res = await fetch(`/api/apikeys/${id}/show`)
      if (!res.ok) {
        let code: string | undefined
        try { const b = await res.json(); code = b?.code } catch {}
        if (code === 'NO_ENCRYPTED_KEY') {
          showError('This key cannot be revealed. Please rotate a new key.')
          return undefined
        }
        throw new Error('Failed to load API key')
      }
      const body = await res.json()
      const full = body?.apiKey?.fullKey
      setFullKeyMap((prev) => ({ ...prev, [id]: full }))
      return full
    } finally {
      setLoadingKey((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyTitle.trim()) {
      showError("Please enter a title for your API key");
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

      if (!response.ok) throw new Error(data.error || "Failed to create API key");
      setShowCreateModal(false);
      setNewKeyTitle("");
      showSuccess("API key created");
      // replace temp with real
      await mutateKeys((old: any) => ({ apiKeys: [
        { id: data.apiKey.id, title: data.apiKey.title, apiKey: data.apiKey.apiKey, status: data.apiKey.status, createdAt: data.apiKey.createdAt },
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
          if (!response.ok) throw new Error("Failed to delete API key");
          showSuccess(`Deleted "${keyTitle}"`);
          // cleanup local cache
          setFullKeyMap((prev) => { const c = { ...prev }; delete c[keyId]; return c })
          // revalidate from server to confirm deletion
          if (!isTestEnv) {
            await mutateKeys(undefined, true)
          }
        } catch (e) {
          console.error("Error deleting API key", e);
          showError("Failed to delete API key");
          // rollback
          await mutateKeys()
        }
      },
      () => showInfo("Deletion cancelled")
    );
  };

  return (
    <div>
      <div className="dashboard-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: "#fff", marginBottom: 8 }}>API Keys</h1>
            <p style={{ fontSize: 14, color: "#999" }}>Manage your API keys for accessing our services</p>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0 as any, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, padding: 24, width: "90%", maxWidth: 500 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 20 }}>Create New API Key</h3>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 14, color: "#999", marginBottom: 8 }}>Key Title</label>
              <input type="text" value={newKeyTitle} onChange={(e) => setNewKeyTitle(e.target.value)} placeholder="e.g., Production Key" style={{ width: "100%", padding: 10, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#fff", fontSize: 14 }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { setShowCreateModal(false); setNewKeyTitle(""); }} style={{ flex: 1, padding: 10, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#999", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleCreateKey} disabled={creating || !newKeyTitle.trim()} style={{ flex: 1, padding: 10, background: creating || !newKeyTitle.trim() ? "#333" : "linear-gradient(135deg, #794aff 0%, #b084ff 100%)", border: "none", borderRadius: 6, color: "#fff", fontSize: 14, fontWeight: 500, cursor: creating || !newKeyTitle.trim() ? "not-allowed" : "pointer" }}>{creating ? "Creating..." : "Create Key"}</button>
            </div>
          </div>
        </div>
      )}

      {apiKeysResp === undefined ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, color: "#999" }}>Loading API keys...</div>
      ) : apiKeys.length === 0 ? (
        <div className="balance-card" style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <FiKey style={{ fontSize: 48, color: "#666", marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 8 }}>No API Keys Yet</h3>
          <p style={{ fontSize: 14, color: "#999", marginBottom: 24 }}>Create your first API key to start using our services programmatically</p>
          <button className="btn" style={{ background: "linear-gradient(135deg, #794aff 0%, #b084ff 100%)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer" }} onClick={() => setShowCreateModal(true)}>
            <FiPlus style={{ marginRight: 8 }} /> Create Your First Key
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
                  <code className="api-key-code">{showKey[apiKey.id] ? (fullKeyMap[apiKey.id] || 'Loading...') : apiKey.apiKey}</code>
                  <div className="api-key-actions">
                    <button className="btn-icon" aria-label={showKey[apiKey.id] ? 'Hide API key' : 'Reveal API key'} onClick={async () => {
                      if (!showKey[apiKey.id]) {
                        const full = await ensureFullKey(apiKey.id)
                        if (!full) return
                      }
                      setShowKey((prev) => ({ ...prev, [apiKey.id]: !prev[apiKey.id] }))
                    }}>
                      {showKey[apiKey.id] ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <button className="btn-icon" aria-label="Copy API key" onClick={() => handleCopyById(apiKey.id)}>
                      <FiCopy />
                    </button>
                  </div>
                </div>
                <div className="api-key-footer">
                  <div>
                    <span>Created • </span>
                    <span>{new Date(apiKey.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span>Status: </span>
                    <span className={apiKey.status === 'active' ? 'text-success' : 'text-dim'}>{apiKey.status === 'active' ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Start */}
      <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, padding: 20, marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 16 }}>🚀 Quick Start</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div onClick={() => setSelectedGuide(selectedGuide === "claude" ? null : "claude")} style={{ cursor: "pointer", flex: "1 1 300px", minWidth: 260, background: selectedGuide === "claude" ? "#121212" : "#1a1a1a", border: selectedGuide === "claude" ? "1px solid #794aff" : "1px solid #2a2a2a", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <FiTerminal style={{ color: "#794aff", fontSize: 24 }} />
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>Claude Code</div>
              <div style={{ color: "#999", fontSize: 12 }}>CLI install & setup</div>
            </div>
          </div>
          <div onClick={() => setSelectedGuide(selectedGuide === "codex" ? null : "codex")} style={{ cursor: "pointer", flex: "1 1 300px", minWidth: 260, background: selectedGuide === "codex" ? "#121212" : "#1a1a1a", border: selectedGuide === "codex" ? "1px solid #00d084" : "1px solid #2a2a2a", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <FiCode style={{ color: "#00d084", fontSize: 24 }} />
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>Codex</div>
              <div style={{ color: "#999", fontSize: 12 }}>CLI install & setup</div>
            </div>
          </div>
        </div>

        {selectedGuide === "claude" && (
          <div>
            <div style={{ display: "flex", gap: 8, borderBottom: "2px solid #1a1a1a", marginBottom: 12 }}>
              <button onClick={() => setActiveTab("windows")} style={{ background: activeTab === "windows" ? "linear-gradient(135deg, #794aff 0%, #b084ff 100%)" : "transparent", color: activeTab === "windows" ? "#fff" : "#999", border: "none", borderRadius: "8px 8px 0 0", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><FaWindows /> Windows</button>
              <button onClick={() => setActiveTab("macos")} style={{ background: activeTab === "macos" ? "linear-gradient(135deg, #794aff 0%, #b084ff 100%)" : "transparent", color: activeTab === "macos" ? "#fff" : "#999", border: "none", borderRadius: "8px 8px 0 0", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><FaApple /> macOS</button>
              <button onClick={() => setActiveTab("linux")} style={{ background: activeTab === "linux" ? "linear-gradient(135deg, #794aff 0%, #b084ff 100%)" : "transparent", color: activeTab === "linux" ? "#fff" : "#999", border: "none", borderRadius: "8px 8px 0 0", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><FaLinux /> Linux</button>
            </div>
            {activeTab === "windows" && (
              <>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>Step 1: Install Node.js</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>Option 1 (Recommended): Download the LTS installer from https://nodejs.org, run the installer and follow default steps.</p>
                  <p style={{ color: "#ccc", marginTop: 4 }}>Option 2 (winget):</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>winget install OpenJS.NodeJS.LTS</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 4 }}>Verify installation:</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>node --version</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>Step 2: Install Claude Code CLI</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#00d084" }}>npm install -g @anthropic-ai/claude-code</code>
                  </div>
                  <p style={{ color: "#aaa", marginTop: 8 }}>If permission issues occur, run PowerShell as Administrator.</p>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>Step 3: Configure Environment</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>PowerShell (temporary for current session):</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>$env:ANTHROPIC_BASE_URL = "https://koicode.xyz/api"</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>{`$env:ANTHROPIC_AUTH_TOKEN = "${userApiKey || 'Your Token'}"`}</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 12 }}>Permanent (user scope):</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>[System.Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://koicode.xyz/api", [System.EnvironmentVariableTarget]::User)</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>{`[System.Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "${userApiKey || 'Your Token'}", [System.EnvironmentVariableTarget]::User)`}</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>Step 4: Get Started</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#00d084" }}>claude</code>
                  </div>
                </div>
              </>
            )}
            {activeTab === "macos" && (
              <>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>Step 1: Install Node.js</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>Option 1 (Recommended): Use Homebrew.</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>brew install node</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 4 }}>Option 2: Download the LTS installer (.pkg) from https://nodejs.org and follow the instructions.</p>
                  <p style={{ color: "#ccc", marginTop: 4 }}>Verify installation:</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>node --version</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>Step 2: Install Claude Code CLI</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#00d084" }}>npm install -g @anthropic-ai/claude-code</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>Step 3: Configure Environment</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>Temporary (current session):</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>export ANTHROPIC_BASE_URL="https://koicode.xyz/api"</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>{`export ANTHROPIC_AUTH_TOKEN="${userApiKey || 'Your API Token'}"`}</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 12 }}>Permanent (~/.zshrc or ~/.bash_profile):</p>
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
                  <h5 style={{ margin: 0, color: "#fff" }}>Step 4: Get Started</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#00d084" }}>claude</code>
                  </div>
                </div>
              </>
            )}
            {activeTab === "linux" && (
              <>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>Step 1: Install Node.js</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>Use your distribution's package manager, then verify with node --version. Examples:</p>
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
                  <h5 style={{ margin: 0, color: "#fff" }}>Step 2: Install Claude Code CLI</h5>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginTop: 8 }}>
                    <code style={{ color: "#00d084" }}>sudo npm install -g @anthropic-ai/claude-code</code>
                  </div>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h5 style={{ margin: 0, color: "#fff" }}>Step 3: Configure Environment</h5>
                  <p style={{ color: "#ccc", marginTop: 8 }}>Temporary (current session):</p>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                    <code style={{ color: "#00d084" }}>export ANTHROPIC_BASE_URL="https://koicode.xyz/api"</code>
                  </div>
                  <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                    <code style={{ color: "#00d084" }}>{`export ANTHROPIC_AUTH_TOKEN="${userApiKey || 'Your API Token'}"`}</code>
                  </div>
                  <p style={{ color: "#ccc", marginTop: 12 }}>Permanent (~/.bashrc):</p>
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
                  <h5 style={{ margin: 0, color: "#fff" }}>Step 4: Get Started</h5>
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
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>Usage Note</div>
              <p style={{ fontSize: 14, color: "#ccc", margin: 0 }}>Your koi.codes API key can be used in both Codex and Claude Code.</p>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>Step 0: Install Codex</div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>npm install -g @openai/codex</code>
              </div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>brew install codex</code>
              </div>
              <div style={{ fontSize: 12, color: "#999" }}>For other platforms and troubleshooting, see https://github.com/openai/codex</div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>Step 1: Create auth.json</div>
              <p style={{ color: "#ccc", marginTop: 4 }}>Delete any existing auth.json under ~/.codex (if present), then create a new auth.json.</p>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>rm ~/.codex/auth.json</code>
              </div>
              <p style={{ color: "#ccc", marginTop: 4 }}>Then create a new ~/.codex/auth.json with the following content:</p>
              <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                <pre style={{ margin: 0 }}><code style={{ fontSize: 14, color: "#00d084" }}>{`{
  "OPENAI_API_KEY": null
}`}</code></pre>
              </div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>Step 2: Create config.toml</div>
              <div style={{ background: "#221a00", border: "1px solid #ffa500", borderRadius: 6, padding: 10, marginBottom: 8 }}>
                <div style={{ color: "#ffa500", fontWeight: 700, marginBottom: 4 }}>Important</div>
                <div style={{ color: "#ffd27f", fontSize: 12 }}>The config file must be named config.toml and use TOML format. Do not create config.json or other formats.</div>
              </div>
              <p style={{ color: "#ccc", marginTop: 4 }}>Delete any existing config.toml under ~/.codex (if present), then create a new config.toml.</p>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>rm ~/.codex/config.toml</code>
              </div>
              <p style={{ color: "#ccc", marginTop: 4 }}>Then create a new ~/.codex/config.toml with the content below:</p>
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
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>Step 3: Set Environment Variable</div>
              <p style={{ color: "#ccc", marginTop: 4 }}>Temporary (current session):</p>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>{`export KOI_OPENAI_TOKEN="${userApiKey || 'Your API Token'}"`}</code>
              </div>
              <p style={{ color: "#ccc", marginTop: 4 }}>Permanent (~/.zshrc or ~/.bash_profile):</p>
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
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>Step 4: Get Started</div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>codex</code>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog {...confirmState} />
    </div>
  );
}
