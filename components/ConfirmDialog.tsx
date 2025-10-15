'use client';

import React from 'react';
import { useT } from '@/contexts/I18nContext'

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmDialog({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ConfirmDialogProps) {
  if (!isOpen) return null;
  let t = (k: string) => k
  try { t = useT().t } catch {}
  const confirmLabel = confirmText || t('common.confirm')
  const cancelLabel = cancelText || t('common.cancel')

  return (
    <>
      <div 
        className="confirm-backdrop"
        onClick={onCancel}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          animation: 'fadeIn 0.3s ease-in-out',
        }}
      />
      <div
        className="confirm-dialog"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          maxWidth: '420px',
          width: '90%',
          animation: 'slideIn 0.3s ease-in-out',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '2px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #fdfbff 0%, #f5f0ff 100%)',
              borderRadius: '14px',
              padding: '28px',
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <p
                style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  color: '#2d1b69',
                  margin: 0,
                  lineHeight: '1.6',
                  textAlign: 'center',
                }}
              >
                {message}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  onConfirm();
                  onCancel(); // Close dialog after confirm
                }}
                className="confirm-btn-primary"
                style={{
                  padding: '11px 28px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '110px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {t('common.confirm')}
              </button>
              <button
                onClick={onCancel}
                className="confirm-btn-secondary"
                style={{
                  padding: '11px 28px',
                  background: '#ffffff',
                  color: '#6b7280',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '110px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}
