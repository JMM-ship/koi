"use client";

import { useState, useEffect } from "react";
import { FiCopy, FiEye, FiEyeOff, FiPlus, FiTrash2, FiKey, FiMonitor, FiTerminal } from "react-icons/fi";
import { FaApple, FaWindows, FaLinux } from "react-icons/fa";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function ApiKeysContent() {
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyTitle, setNewKeyTitle] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'windows' | 'macos' | 'linux'>('windows');
  const { showSuccess, showInfo, showError } = useToast();
  const { confirmState, showConfirm } = useConfirm();

  // 获取 API 密钥列表
  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/apikeys');
      if (!response.ok) throw new Error('Failed to fetch API keys');
      const data = await response.json();

      const activeKeys = (data.apiKeys || [])
        .filter((key: any) => key.status !== "deleted");

      setApiKeys(activeKeys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      showError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showSuccess('API key copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleKeyVisibility = (keyId: number) => {
    setShowKey(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  // 创建新的 API 密钥
  const handleCreateKey = async () => {
    if (!newKeyTitle.trim()) {
      showError('Please enter a title for your API key');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/apikeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newKeyTitle }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create API key');
      }

      // 保存新创建的密钥以便显示
      setNewlyCreatedKey(data.apiKey.apiKey);

      // 显示新密钥模态框
      setShowCreateModal(false);
      setNewKeyTitle('');

      // 显示成功消息和密钥
      setTimeout(() => {
        showNewKeyModal(data.apiKey.apiKey);
      }, 300);

      // 刷新列表
      await fetchApiKeys();
    } catch (error: any) {
      console.error('Error creating API key:', error);
      showError(error.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  // 显示新创建的密钥
  const showNewKeyModal = (key: string) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    `;

    modal.innerHTML = `
      <div style="background: #0a0a0a; border: 2px solid #00d084; border-radius: 12px; padding: 24px; max-width: 600px; width: 90%;">
        <h3 style="color: #00d084; margin-bottom: 16px; font-size: 20px;">🎉 API Key Created Successfully!</h3>
        <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="color: #ffa500; margin-bottom: 8px; font-weight: 600;">⚠️ Important: Save this key now!</p>
          <p style="color: #999; margin-bottom: 16px; font-size: 14px;">This is the only time you'll see your full API key. Store it securely.</p>
          <div style="background: #000; border: 1px solid #2a2a2a; border-radius: 4px; padding: 12px; word-break: break-all;">
            <code style="color: #00d084; font-family: monospace; font-size: 14px;">${key}</code>
          </div>
        </div>
        <button id="copyNewKey" style="background: linear-gradient(135deg, #794aff 0%, #b084ff 100%); color: white; border: none; padding: 10px 20px; border-radius: 6px; margin-right: 12px; cursor: pointer;">
          Copy to Clipboard
        </button>
        <button id="closeModal" style="background: #1a1a1a; color: #999; border: 1px solid #2a2a2a; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
          I've Saved It
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('copyNewKey')?.addEventListener('click', () => {
      navigator.clipboard.writeText(key);
      showSuccess('API key copied to clipboard');
    });

    document.getElementById('closeModal')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  };

  // 删除 API 密钥
  const handleDeleteKey = async (keyId: number, keyTitle: string) => {
    showConfirm(
      `Are you sure you want to delete "${keyTitle}"? This action cannot be undone.`,
      async () => {
        try {
          const response = await fetch(`/api/apikeys?id=${keyId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete API key');
          }

          showSuccess(`Deleted "${keyTitle}"`);
          await fetchApiKeys();
        } catch (error) {
          console.error('Error deleting API key:', error);
          showError('Failed to delete API key');
        }
      },
      () => showInfo('Deletion cancelled')
    );
  };

  return (

    <>
      <div className="dashboard-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>API Keys</h1>
            <p style={{ fontSize: '14px', color: '#999' }}>Manage your API keys for accessing our services</p>
          </div>
          {/* <button className="btn" style={{
            background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
            onClick={() => setShowCreateModal(true)}
          >
            <FiPlus /> Create New Key
          </button> */}
        </div>
      </div>

      {/* 创建 API 密钥模态框 */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#0a0a0a',
            border: '1px solid #1a1a1a',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '20px' }}>
              Create New API Key
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#999', marginBottom: '8px' }}>
                Key Title
              </label>
              <input
                type="text"
                value={newKeyTitle}
                onChange={(e) => setNewKeyTitle(e.target.value)}
                placeholder="e.g., Production Key"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FiKey style={{ color: '#ffa500' }} />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffa500' }}>Important</span>
              </div>
              <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
                • Each user can only have one active API key<br />
                • Your key will only be shown once<br />
                • Save it in a secure location immediately
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewKeyTitle('');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '6px',
                  color: '#999',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                disabled={creating || !newKeyTitle.trim()}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: creating || !newKeyTitle.trim() ? '#333' : 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: creating || !newKeyTitle.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? 'Creating...' : 'Create Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          color: '#999'
        }}>
          Loading API keys...
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="balance-card" style={{
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <FiKey style={{ fontSize: '48px', color: '#666', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
            No API Keys Yet
          </h3>
          <p style={{ fontSize: '14px', color: '#999', marginBottom: '24px' }}>
            Create your first API key to start using our services programmatically
          </p>
          <button
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
            onClick={() => setShowCreateModal(true)}
          >
            <FiPlus style={{ marginRight: '8px', display: 'inline' }} />
            Create Your First Key
          </button>
        </div>
      ) : (
        <div className="row">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="col-lg-6 mb-4">
              <div className="balance-card" style={{
                background: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative'
              }}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>{apiKey.title}</h4>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: apiKey.status === 'active' ? '#00d084' : '#4b5563',
                      color: apiKey.status === 'active' ? '#000' : '#999',
                      textTransform: 'uppercase'
                    }}>
                      {apiKey.status}
                    </span>
                  </div>
                  <button style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff006e',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                    onClick={() => handleDeleteKey(apiKey.id, apiKey.title)}
                  >
                    <FiTrash2 />
                  </button>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '16px',
                  position: 'relative'
                }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <code style={{
                      color: '#794aff',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      letterSpacing: '0.5px'
                    }}>
                      {showKey[apiKey.id] ? apiKey.fullKey : apiKey.apiKey}
                    </code>
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#999',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        {showKey[apiKey.id] ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <button
                        onClick={() => handleCopy(apiKey.fullKey)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedKey === apiKey.fullKey ? '#00d084' : '#999',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <FiCopy />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between" style={{ fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#666' }}>Created: </span>
                    <span style={{ color: '#fff' }}>
                      {new Date(apiKey.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#666' }}>Status: </span>
                    <span style={{ color: apiKey.status === 'active' ? '#00d084' : '#666' }}>
                      {apiKey.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="balance-card" style={{
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '20px' }}>API Usage Guidelines</h3>

        <div className="row" style={{ width: 600 }}>
          <div className="col-md-3">
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Rate Limit</p>
              <h4 style={{ fontSize: '24px', color: '#fff', fontWeight: '600' }}>1000/min</h4>
              <span style={{ fontSize: '12px', color: '#00d084' }}>Professional tier</span>
            </div>
          </div>
          <div className="col-md-3">
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Concurrent Requests</p>
              <h4 style={{ fontSize: '24px', color: '#fff', fontWeight: '600' }}>100</h4>
              <span style={{ fontSize: '12px', color: '#00d084' }}>Maximum</span>
            </div>
          </div>
          <div className="col-md-3">
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Timeout</p>
              <h4 style={{ fontSize: '24px', color: '#fff', fontWeight: '600' }}>30s</h4>
              <span style={{ fontSize: '12px', color: '#666' }}>Per request</span>
            </div>
          </div>
          <div className="col-md-3">
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Support</p>
              <h4 style={{ fontSize: '24px', color: '#fff', fontWeight: '600' }}>24/7</h4>
              <span style={{ fontSize: '12px', color: '#00d084' }}>Available</span>
            </div>
          </div>
        </div>

        <div style={{
          background: '#1a1a1a',
          borderRadius: '6px',
          padding: '12px',
          marginTop: '20px'
        }}>
          <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
            <strong style={{ color: '#fff' }}>Security Tips:</strong><br />
            • Never share your API key publicly or commit it to version control<br />
            • Use environment variables to store your keys in production<br />
            • Rotate your keys regularly for better security<br />
            • Monitor your API usage for any unusual activity
          </p>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div style={{
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '20px' }}>
          🚀 Quick Start
        </h3>

        <div style={{ marginBottom: '24px', width: "100%" }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#794aff', marginBottom: '12px' }}>
            📦 Claude Code CLI Installation Guide
          </h4>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
            Select your operating system and follow the steps to complete the installation
          </p>

          {/* Tab buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            borderBottom: '2px solid #1a1a1a',
            paddingBottom: '0'
          }}>
            <button
              onClick={() => setActiveTab('windows')}
              style={{
                background: activeTab === 'windows' ? 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)' : 'transparent',
                color: activeTab === 'windows' ? '#fff' : '#999',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <FaWindows /> Windows
            </button>
            <button
              onClick={() => setActiveTab('macos')}
              style={{
                background: activeTab === 'macos' ? 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)' : 'transparent',
                color: activeTab === 'macos' ? '#fff' : '#999',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <FaApple /> macOS
            </button>
            <button
              onClick={() => setActiveTab('linux')}
              style={{
                background: activeTab === 'linux' ? 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)' : 'transparent',
                color: activeTab === 'linux' ? '#fff' : '#999',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <FaLinux /> Linux
            </button>
          </div>

          {/* Tab content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Windows Installation */}
            {activeTab === 'windows' && (
              <>
                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                      color: '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>1</span>
                    <h5 style={{ fontSize: '22px', fontWeight: '600', color: '#fff', margin: 0 }}>
                      Install Node.js
                    </h5>
                  </div>
                  <p style={{ fontSize: '18px', color: '#999', marginBottom: '12px' }}>
                    Ensure Node.js is installed on your system
                  </p>
                  <p style={{ fontSize: '16px', color: '#fff' }}>
                    1: Visit <a href="https://nodejs.org" style={{ color: '#794aff', textDecoration: 'none' }}>https://nodejs.org</a><br />
                    2: Download LTS version installer<br />
                    3: Double-click to run the installation program and keep the default Settings
                  </p>
                  <p style={{ fontSize: '16px', color: '#fff', marginTop: '12px' }}>
                    Check the installation of Node.js:
                  </p>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>node --version</code>
                  </div>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                      color: '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>2</span>
                    <h5 style={{ fontSize: '22px', fontWeight: '600', color: '#fff', margin: 0 }}>
                      Install Claude Code CLI
                    </h5>
                  </div>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>npm install -g @anthropic-ai/claude-code</code>
                  </div>
                  <p style={{ fontSize: '16px', color: '#fff' }}>
                    💡 If permission issues occur, run PowerShell as administrator
                  </p>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                      color: '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>3</span>
                    <h5 style={{ fontSize: '22px', fontWeight: '600', color: '#fff', margin: 0 }}>
                      Configure Environment
                    </h5>
                  </div>
                  <p style={{ fontSize: '18px', color: '#fff', marginBottom: '12px' }}>
                    PowerShell Temporary Setting (Current Session)
                  </p>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>$env:ANTHROPIC_BASE_URL = "https://api.jiuwanliguoxue.com"</code>
                  </div>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>$env:ANTHROPIC_AUTH_TOKEN = "Your Token"</code>
                  </div>
                  <p style={{ fontSize: '18px', color: '#fff', marginBottom: '12px' }}>
                    Permanent Setting (Recommended)
                  </p>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>[System.Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://api.jiuwanliguoxue.com", [System.EnvironmentVariableTarget]::User)</code>
                  </div>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>[System.Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "Your Token", [System.EnvironmentVariableTarget]::User)</code>
                  </div>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                      color: '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>4</span>
                    <h5 style={{ fontSize: '22px', fontWeight: '600', color: '#fff', margin: 0 }}>
                      Get Started
                    </h5>
                  </div>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>claude</code>
                  </div>
                </div>
              </>
            )}

            {/* macOS Installation */}
            {activeTab === 'macos' && (
              <>
                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                      color: '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>1</span>
                    <h5 style={{ fontSize: '22px', fontWeight: '600', color: '#fff', margin: 0 }}>
                      Install Node.js
                    </h5>
                  </div>
                  <p style={{ fontSize: '18px', color: '#999', marginBottom: '12px' }}>
                    Install Node.js using Homebrew or download from nodejs.org
                  </p>
                  <p style={{ fontSize: '16px', color: '#fff', marginBottom: '12px' }}>
                    Option 1: Using Homebrew (Recommended)
                  </p>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '12px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>brew install node</code>
                  </div>
                  <p style={{ fontSize: '16px', color: '#fff', marginBottom: '12px' }}>
                    Option 2: Download from <a href="https://nodejs.org" style={{ color: '#794aff', textDecoration: 'none' }}>https://nodejs.org</a>
                  </p>
                  <p style={{ fontSize: '16px', color: '#fff', marginTop: '12px' }}>
                    Verify installation:
                  </p>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>node --version</code>
                  </div>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                      color: '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>2</span>
                    <h5 style={{ fontSize: '22px', fontWeight: '600', color: '#fff', margin: 0 }}>
                      Install Claude Code CLI
                    </h5>
                  </div>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>npm install -g @anthropic-ai/claude-code</code>
                  </div>
                  <p style={{ fontSize: '16px', color: '#fff' }}>
                    💡 If permission issues occur, use sudo: <code style={{ color: '#794aff' }}>sudo npm install -g @anthropic-ai/claude-code</code>
                  </p>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                      color: '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>3</span>
                    <h5 style={{ fontSize: '22px', fontWeight: '600', color: '#fff', margin: 0 }}>
                      Configure Environment
                    </h5>
                  </div>
                  <p style={{ fontSize: '18px', color: '#fff', marginBottom: '12px' }}>
                    Temporary Setting (Current Session)
                  </p>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>export ANTHROPIC_BASE_URL="https://api.jiuwanliguoxue.com"</code>
                  </div>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>export ANTHROPIC_AUTH_TOKEN="Your API Token"</code>
                  </div>
                  <p style={{ fontSize: '18px', color: '#fff', marginBottom: '12px' }}>
                    Permanent Setting (Add to ~/.zshrc or ~/.bash_profile)
                  </p>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>echo 'export ANTHROPIC_BASE_URL="https://api.jiuwanliguoxue.com"' &gt;&gt; ~/.zshrc</code>
                  </div>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>echo 'export ANTHROPIC_AUTH_TOKEN="Your API Token"' &gt;&gt; ~/.zshrc</code>
                  </div>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>source ~/.zshrc</code>
                  </div>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                      color: '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>4</span>
                    <h5 style={{ fontSize: '22px', fontWeight: '600', color: '#fff', margin: 0 }}>
                      Get Started
                    </h5>
                  </div>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>claude</code>
                  </div>
                </div>
              </>
            )}

            {/* Linux Installation */}
            {activeTab === 'linux' && (
              <>
                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                      color: '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>1</span>
                    <h5 style={{ fontSize: '22px', fontWeight: '600', color: '#fff', margin: 0 }}>
                      Install Node.js
                    </h5>
                  </div>
                  <p style={{ fontSize: '18px', color: '#999', marginBottom: '12px' }}>
                    Install Node.js using your distribution's package manager
                  </p>
                  <p style={{ fontSize: '16px', color: '#fff', marginBottom: '12px' }}>
                    Ubuntu/Debian:
                  </p>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '12px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>sudo apt update && sudo apt install nodejs npm</code>
                  </div>
                  <p style={{ fontSize: '16px', color: '#fff', marginBottom: '12px' }}>
                    Fedora/RHEL/CentOS:
                  </p>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '12px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>sudo dnf install nodejs npm</code>
                  </div>
                  <p style={{ fontSize: '16px', color: '#fff', marginBottom: '12px' }}>
                    Arch Linux:
                  </p>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '12px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>sudo pacman -S nodejs npm</code>
                  </div>
                  <p style={{ fontSize: '16px', color: '#fff', marginTop: '12px' }}>
                    Verify installation:
                  </p>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>node --version</code>
                  </div>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                      color: '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>2</span>
                    <h5 style={{ fontSize: '22px', fontWeight: '600', color: '#fff', margin: 0 }}>
                      Install Claude Code CLI
                    </h5>
                  </div>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>sudo npm install -g @anthropic-ai/claude-code</code>
                  </div>
                  <p style={{ fontSize: '16px', color: '#fff' }}>
                    💡 Make sure npm has the correct permissions configured
                  </p>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                      color: '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>3</span>
                    <h5 style={{ fontSize: '22px', fontWeight: '600', color: '#fff', margin: 0 }}>
                      Configure Environment
                    </h5>
                  </div>
                  <p style={{ fontSize: '18px', color: '#fff', marginBottom: '12px' }}>
                    Temporary Setting (Current Session)
                  </p>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>export ANTHROPIC_BASE_URL="https://api.jiuwanliguoxue.com"</code>
                  </div>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>export ANTHROPIC_AUTH_TOKEN="Your API Token"</code>
                  </div>
                  <p style={{ fontSize: '18px', color: '#fff', marginBottom: '12px' }}>
                    Permanent Setting (Add to ~/.bashrc)
                  </p>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>echo 'export ANTHROPIC_BASE_URL="https://api.jiuwanliguoxue.com"' &gt;&gt; ~/.bashrc</code>
                  </div>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>echo 'export ANTHROPIC_AUTH_TOKEN="Your API Token"' &gt;&gt; ~/.bashrc</code>
                  </div>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>source ~/.bashrc</code>
                  </div>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                      color: '#fff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>4</span>
                    <h5 style={{ fontSize: '22px', fontWeight: '600', color: '#fff', margin: 0 }}>
                      Get Started
                    </h5>
                  </div>
                  <div style={{
                    background: '#000',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <code style={{ fontSize: '16px', color: '#00d084' }}>claude</code>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog {...confirmState} />
    </>
  );
}