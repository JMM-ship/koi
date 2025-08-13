"use client";

import { useState } from "react";
import { FiCopy, FiEye, FiEyeOff, FiPlus, FiTrash2 } from "react-icons/fi";
import { useToast } from "@/hooks/useToast";

export default function ApiKeysContent() {
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { showSuccess, showInfo, showConfirm } = useToast();

  const apiKeys = [
    {
      id: 1,
      name: "Production API Key",
      key: "sk-prod-4NzK9mW2xL8vQ3jF6hR1tY5pU7aS0dG",
      created: "Jan 5, 2025",
      lastUsed: "2 hours ago",
      status: "active"
    },
    {
      id: 2,
      name: "Development API Key",
      key: "sk-dev-8HgF3nM1qW5eR7tY2uI9oP0aS4dL6kJ",
      created: "Dec 20, 2024",
      lastUsed: "5 days ago",
      status: "active"
    },
    {
      id: 3,
      name: "Testing API Key",
      key: "sk-test-2BnV6cX9zL1kM3jH5gF8dS0aQ4wE7rT",
      created: "Dec 10, 2024",
      lastUsed: "Never",
      status: "inactive"
    }
  ];

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showSuccess('API key copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleKeyVisibility = (keyId: number) => {
    setShowKey(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  return (
    <>
      <div className="dashboard-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>API Keys</h1>
            <p style={{ fontSize: '14px', color: '#999' }}>Manage your API keys for accessing our services</p>
          </div>
          <button className="btn" style={{
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
          onClick={() => showInfo('Create API key feature coming soon')}
          >
            <FiPlus /> Create New Key
          </button>
        </div>
      </div>

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
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>{apiKey.name}</h4>
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
                onClick={() => {
                  showConfirm(
                    `Are you sure you want to delete "${apiKey.name}"? This action cannot be undone.`,
                    () => showSuccess(`Deleted "${apiKey.name}"`),
                    () => showInfo('Deletion cancelled')
                  );
                }}
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
                    {showKey[apiKey.id] ? apiKey.key : '••••••••••••••••••••••••••••••••'}
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
                      onClick={() => handleCopy(apiKey.key)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedKey === apiKey.key ? '#00d084' : '#999',
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
                  <span style={{ color: '#fff' }}>{apiKey.created}</span>
                </div>
                <div>
                  <span style={{ color: '#666' }}>Last used: </span>
                  <span style={{ color: '#fff' }}>{apiKey.lastUsed}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="balance-card" style={{
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '20px' }}>API Usage Statistics</h3>
        
        <div className="row">
          <div className="col-md-3">
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Requests (Today)</p>
              <h4 style={{ fontSize: '24px', color: '#fff', fontWeight: '600' }}>12,458</h4>
              <span style={{ fontSize: '12px', color: '#00d084' }}>+15% from yesterday</span>
            </div>
          </div>
          <div className="col-md-3">
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Success Rate</p>
              <h4 style={{ fontSize: '24px', color: '#fff', fontWeight: '600' }}>99.8%</h4>
              <span style={{ fontSize: '12px', color: '#00d084' }}>Excellent</span>
            </div>
          </div>
          <div className="col-md-3">
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Average Latency</p>
              <h4 style={{ fontSize: '24px', color: '#fff', fontWeight: '600' }}>45ms</h4>
              <span style={{ fontSize: '12px', color: '#00d084' }}>-5ms from average</span>
            </div>
          </div>
          <div className="col-md-3">
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Rate Limit</p>
              <h4 style={{ fontSize: '24px', color: '#fff', fontWeight: '600' }}>1000/min</h4>
              <span style={{ fontSize: '12px', color: '#666' }}>Professional tier</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}