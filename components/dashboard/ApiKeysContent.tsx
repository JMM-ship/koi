"use client";

import { useEffect, useState } from "react";
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
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyTitle, setNewKeyTitle] = useState("");
  const [activeTab, setActiveTab] = useState<GuideTab>("windows");
  const [selectedGuide, setSelectedGuide] = useState<GuideKind>(null);
  const { showSuccess, showInfo, showError } = useToast();
  const { confirmState, showConfirm } = useConfirm();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/apikeys");
        if (!res.ok) throw new Error("Failed to fetch API keys");
        const data = await res.json();
        setApiKeys((data.apiKeys || []).filter((k: any) => k.status !== "deleted"));
      } catch (e) {
        console.error("Error fetching API keys", e);
        showError("Failed to load API keys");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const userApiKey = apiKeys.find((k) => k.status === "active")?.fullKey || "";

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showSuccess("API key copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateKey = async () => {
    if (!newKeyTitle.trim()) {
      showError("Please enter a title for your API key");
      return;
    }
    setCreating(true);
    try {
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
      // refresh list
      const res = await fetch("/api/apikeys");
      const next = await res.json();
      setApiKeys((next.apiKeys || []).filter((k: any) => k.status !== "deleted"));
    } catch (e: any) {
      console.error("Error creating API key", e);
      showError(e.message || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string, keyTitle: string) => {
    showConfirm(
      `Are you sure you want to delete "${keyTitle}"? This action cannot be undone.`,
      async () => {
        try {
          const response = await fetch(`/api/apikeys?id=${keyId}`, { method: "DELETE" });
          if (!response.ok) throw new Error("Failed to delete API key");
          showSuccess(`Deleted "${keyTitle}"`);
          const res = await fetch("/api/apikeys");
          const next = await res.json();
          setApiKeys((next.apiKeys || []).filter((k: any) => k.status !== "deleted"));
        } catch (e) {
          console.error("Error deleting API key", e);
          showError("Failed to delete API key");
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

      {loading ? (
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
              <div className="balance-card" style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, padding: 20 }}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{apiKey.title}</h4>
                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: apiKey.status === "active" ? "#00d084" : "#4b5563", color: apiKey.status === "active" ? "#000" : "#999", textTransform: "uppercase" }}>{apiKey.status}</span>
                  </div>
                  <button style={{ background: "none", border: "none", color: "#ff006e", cursor: "pointer", padding: 4 }} onClick={() => handleDeleteKey(apiKey.id, apiKey.title)}>
                    <FiTrash2 />
                  </button>
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 6, padding: 12, marginBottom: 16 }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <code style={{ color: "#794aff", fontSize: 12, fontFamily: "monospace", letterSpacing: 0.5 }}>{showKey[apiKey.id] ? apiKey.fullKey : apiKey.apiKey}</code>
                    <div className="d-flex gap-2">
                      <button onClick={() => setShowKey((prev) => ({ ...prev, [apiKey.id]: !prev[apiKey.id] }))} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", padding: 4 }}>{showKey[apiKey.id] ? <FiEyeOff /> : <FiEye />}</button>
                      <button onClick={() => handleCopy(apiKey.fullKey)} style={{ background: "none", border: "none", color: copiedKey === apiKey.fullKey ? "#00d084" : "#999", cursor: "pointer", padding: 4 }}>
                        <FiCopy />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-between" style={{ fontSize: 12 }}>
                  <div>
                    <span style={{ color: "#666" }}>Created: </span>
                    <span style={{ color: "#fff" }}>{new Date(apiKey.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <div>
                    <span style={{ color: "#666" }}>Status: </span>
                    <span style={{ color: apiKey.status === "active" ? "#00d084" : "#666" }}>{apiKey.status === "active" ? "Active" : "Inactive"}</span>
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
              <div style={{ color: "#999", fontSize: 12 }}>CLI 安装与配置</div>
            </div>
          </div>
          <div onClick={() => setSelectedGuide(selectedGuide === "codex" ? null : "codex")} style={{ cursor: "pointer", flex: "1 1 300px", minWidth: 260, background: selectedGuide === "codex" ? "#121212" : "#1a1a1a", border: selectedGuide === "codex" ? "1px solid #00d084" : "1px solid #2a2a2a", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <FiCode style={{ color: "#00d084", fontSize: 24 }} />
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>Codex</div>
              <div style={{ color: "#999", fontSize: 12 }}>CLI 安装与配置</div>
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
              <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16 }}>
                <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                  <code style={{ color: "#00d084" }}>npm install -g @anthropic-ai/claude-code</code>
                </div>
                <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                  <code style={{ color: "#00d084" }}>$env:ANTHROPIC_BASE_URL = "https://api.jiuwanliguoxue.com"</code>
                </div>
                <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                  <code style={{ color: "#00d084" }}>$env:ANTHROPIC_AUTH_TOKEN = "{userApiKey || 'Your Token'}"</code>
                </div>
              </div>
            )}
            {activeTab === "macos" && (
              <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16 }}>
                <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                  <code style={{ color: "#00d084" }}>npm install -g @anthropic-ai/claude-code</code>
                </div>
                <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                  <code style={{ color: "#00d084" }}>export ANTHROPIC_BASE_URL="https://api.jiuwanliguoxue.com"</code>
                </div>
                <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                  <code style={{ color: "#00d084" }}>export ANTHROPIC_AUTH_TOKEN="{userApiKey || 'Your API Token'}"</code>
                </div>
              </div>
            )}
            {activeTab === "linux" && (
              <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16 }}>
                <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                  <code style={{ color: "#00d084" }}>sudo npm install -g @anthropic-ai/claude-code</code>
                </div>
                <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                  <code style={{ color: "#00d084" }}>export ANTHROPIC_BASE_URL="https://api.jiuwanliguoxue.com"</code>
                </div>
                <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                  <code style={{ color: "#00d084" }}>export ANTHROPIC_AUTH_TOKEN="{userApiKey || 'Your API Token'}"</code>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedGuide === "codex" && (
          <div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>使用说明</div>
              <p style={{ fontSize: 14, color: "#ccc", margin: 0 }}>koi.codes的 API Key可以同时在 Codex 和 Claude Code 中使用</p>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>0 安装 Codex</div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>npm install -g @openai/codex</code>
              </div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>brew install codex</code>
              </div>
              <div style={{ fontSize: 12, color: "#999" }}>更多平台的安装问题可以查看 https://github.com/openai/codex</div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>1 创建 auth.json 文件</div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>rm ~/.codex/auth.json</code>
              </div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                <pre style={{ margin: 0 }}><code style={{ fontSize: 14, color: "#00d084" }}>{`{
  "OPENAI_API_KEY": "${userApiKey || 'Your Token'}"
}`}</code></pre>
              </div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>创建 config.toml 文件</div>
              <div style={{ background: "#221a00", border: "1px solid #ffa500", borderRadius: 6, padding: 10, marginBottom: 8 }}>
                <div style={{ color: "#ffa500", fontWeight: 700, marginBottom: 4 }}>重要提示</div>
                <div style={{ color: "#ffd27f", fontSize: 12 }}>配置文件必须命名为 config.toml 并使用 TOML 格式，千万不要误创建 config.json 或其他格式。</div>
              </div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8, marginBottom: 8 }}>
                <code style={{ fontSize: 14, color: "#00d084" }}>rm ~/.codex/config.toml</code>
              </div>
              <div style={{ background: "#000", borderRadius: 4, padding: 8 }}>
                <pre style={{ margin: 0 }}><code style={{ fontSize: 14, color: "#00d084" }}>{`model_provider = "aicodewith"
model = "gpt-5-codex"
model_reasoning_effort = "high"
disable_response_storage = true
preferred_auth_method = "apikey"
requires_openai_auth = true

[model_providers.aicodewith]
name = "aicodewith"
base_url = "https://api.jiuwanliguoxue.com/chatgpt/v1"
wire_api = "responses"`}</code></pre>
              </div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>Get Started</div>
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

