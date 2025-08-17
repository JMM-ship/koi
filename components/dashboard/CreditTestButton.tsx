"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface CreditTestButtonProps {
  onCreditsUsed?: () => void;
}

export default function CreditTestButton({ onCreditsUsed }: CreditTestButtonProps) {
  const { showSuccess, showError, showLoading, dismiss } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [amount, setAmount] = useState(100);
  const [showModal, setShowModal] = useState(false);

  const handleTestConsumption = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    const loadingToast = showLoading(`Consuming ${amount} credits for testing...`);

    try {
      const response = await fetch('/api/credits/use/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      dismiss(loadingToast);

      if (data.success) {
        showSuccess(`Successfully consumed ${amount} credits!`, {
          duration: 3000,
          icon: '✅',
        });
        
        // Call callback if provided
        if (onCreditsUsed) {
          onCreditsUsed();
        }
        
        setShowModal(false);
      } else {
        throw new Error(data.error?.message || 'Failed to consume credits');
      }
    } catch (error) {
      dismiss();
      console.error('Credit consumption test failed:', error);
      showError(error instanceof Error ? error.message : 'Failed to consume credits');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Test Button */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '50px',
          padding: '12px 24px',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          transition: 'all 0.3s',
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        }}
      >
        <Zap size={16} />
        Test Credit Usage
      </button>

      {/* Modal */}
      {showModal && (
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
          zIndex: 9999,
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            border: '1px solid #333',
          }}>
            <h3 style={{
              color: '#fff',
              marginBottom: '20px',
              fontSize: '18px',
              fontWeight: '600',
            }}>
              Test Credit Consumption
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#999',
                fontSize: '14px',
                marginBottom: '8px',
              }}>
                Amount of credits to consume:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setAmount(Math.min(Math.max(val, 1), 10000));
                  }}
                  min="1"
                  max="10000"
                  style={{
                    flex: 1,
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setAmount(100)}
                    style={{
                      padding: '8px 12px',
                      background: amount === 100 ? '#667eea' : '#222',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    100
                  </button>
                  <button
                    onClick={() => setAmount(500)}
                    style={{
                      padding: '8px 12px',
                      background: amount === 500 ? '#667eea' : '#222',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    500
                  </button>
                  <button
                    onClick={() => setAmount(1000)}
                    style={{
                      padding: '8px 12px',
                      background: amount === 1000 ? '#667eea' : '#222',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    1K
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              background: '#0a0a0a',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffa500',
                fontSize: '13px',
              }}>
                <Zap size={14} />
                <span>This will consume {amount.toLocaleString()} credits from your balance</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  background: 'transparent',
                  color: '#999',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#222';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleTestConsumption}
                disabled={isProcessing || amount <= 0}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isProcessing || amount <= 0
                    ? '#333'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isProcessing || amount <= 0 ? 'not-allowed' : 'pointer',
                  opacity: isProcessing || amount <= 0 ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {isProcessing ? 'Processing...' : 'Consume Credits'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}