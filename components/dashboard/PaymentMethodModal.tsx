"use client";

import { FiX, FiCreditCard, FiSmartphone } from "react-icons/fi";
import { SiStripe, SiAlipay } from "react-icons/si";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'stripe' | 'antom') => void;
  processing: boolean;
}

export default function PaymentMethodModal({
  isOpen,
  onClose,
  onSelectMethod,
  processing
}: PaymentMethodModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '560px',
        width: '100%',
        position: 'relative',
        border: '1px solid rgba(121, 74, 255, 0.2)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <button
          onClick={onClose}
          disabled={processing}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: '#666',
            cursor: processing ? 'not-allowed' : 'pointer',
            padding: '4px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => !processing && (e.currentTarget.style.color = '#999')}
          onMouseLeave={(e) => !processing && (e.currentTarget.style.color = '#666')}
        >
          <FiX size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            color: '#fff',
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '8px'
          }}>
            Select Payment Method
          </h2>
          <p style={{
            color: '#999',
            fontSize: '14px',
            margin: 0
          }}>
            Choose your preferred payment method to complete the purchase
          </p>
        </div>

        <div style={{
          display: 'grid',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Stripe Card Payment */}
          <button
            onClick={() => onSelectMethod('stripe')}
            disabled={processing}
            style={{
              background: 'linear-gradient(135deg, rgba(99, 91, 255, 0.1) 0%, rgba(99, 91, 255, 0.05) 100%)',
              border: '2px solid rgba(99, 91, 255, 0.3)',
              borderRadius: '12px',
              padding: '24px',
              cursor: processing ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!processing) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 91, 255, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(99, 91, 255, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!processing) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(99, 91, 255, 0.3)';
              }
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #635BFF 0%, #7A73FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <SiStripe size={28} color="#fff" />
              </div>

              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: '700',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  Card Payment
                  <FiCreditCard size={18} />
                </div>
                <div style={{
                  color: '#999',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  Supports Visa, Mastercard, American Express and other international credit/debit cards
                </div>
              </div>

              <div style={{
                background: 'rgba(99, 91, 255, 0.2)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#a29bff'
              }}>
                Recommended
              </div>
            </div>
          </button>

          {/* Antom E-Wallet Payment */}
          <button
            onClick={() => onSelectMethod('antom')}
            disabled={processing}
            style={{
              background: 'linear-gradient(135deg, rgba(0, 208, 132, 0.1) 0%, rgba(0, 208, 132, 0.05) 100%)',
              border: '2px solid rgba(0, 208, 132, 0.3)',
              borderRadius: '12px',
              padding: '24px',
              cursor: processing ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!processing) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 208, 132, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(0, 208, 132, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!processing) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(0, 208, 132, 0.3)';
              }
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #00d084 0%, #00b377 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <SiAlipay size={28} color="#fff" />
              </div>

              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: '700',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  E-Wallet Payment
                  <FiSmartphone size={18} />
                </div>
                <div style={{
                  color: '#999',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  Supports Alipay, WeChat Pay, GCash, GoPay, Kakao Pay and other e-wallets
                </div>
              </div>
            </div>
          </button>
        </div>

        {processing && (
          <div style={{
            textAlign: 'center',
            padding: '16px',
            background: 'rgba(121, 74, 255, 0.1)',
            border: '1px solid rgba(121, 74, 255, 0.2)',
            borderRadius: '8px',
            marginTop: '16px'
          }}>
            <div style={{
              display: 'inline-block',
              width: '20px',
              height: '20px',
              border: '3px solid rgba(121, 74, 255, 0.3)',
              borderTop: '3px solid #794aff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginRight: '12px'
            }} />
            <span style={{ color: '#794aff', fontSize: '14px', fontWeight: '600' }}>
              Processing payment request...
            </span>
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
