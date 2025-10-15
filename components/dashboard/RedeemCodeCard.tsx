"use client";

import { useState } from "react";
import { FiGift, FiClipboard, FiX, FiLoader } from "react-icons/fi";
import { useT } from "@/contexts/I18nContext";

interface RedeemCodeCardProps {
  mutatePackages: () => Promise<any> | any;
  toast: {
    showSuccess: (msg: string) => void;
    showError: (msg: string) => void;
    showWarning?: (msg: string) => void;
    showInfo?: (msg: string) => void;
  };
}

function toUpperSafe(s: string) {
  return (s || "").toUpperCase();
}

function looksLikeCode(s: string) {
  const up = toUpperSafe(s).trim();
  if (up.length < 6) return false;
  const re = /^[A-Z0-9]+(-[A-Z0-9]{4})+$/;
  const loose = /^[A-Z0-9-]{6,}$/;
  return re.test(up) || loose.test(up);
}

export default function RedeemCodeCard({ mutatePackages, toast }: RedeemCodeCardProps) {
  const { t } = useT()
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const isValidish = looksLikeCode(redeemCode);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && (window as any).isSecureContext !== false) {
        const text = await navigator.clipboard.readText();
        setRedeemCode(toUpperSafe(text).trim());
      } else {
        toast.showWarning?.(t('toasts.clipboardNotAvailable'));
      }
    } catch {
      toast.showWarning?.(t('toasts.failedReadClipboard'));
    }
  };

  const handleClear = () => setRedeemCode("");

  const handleRedeem = async () => {
    if (!redeemCode) return;
    if (!isValidish) {
      toast.showWarning?.(t('toasts.invalidRedeemCodeFormat'));
      return;
    }
    setIsRedeeming(true);
    try {
      const resp = await fetch('/api/codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode.trim() })
      })
      const data = await resp.json()
      if (resp.ok && data?.success) {
        toast.showSuccess(t('toasts.redeemedSuccessfullyPlanUpdated'));
        setRedeemCode("");
        await Promise.resolve(mutatePackages?.());
      } else {
        const msg = data?.error || t('toasts.failedRedeemCode');
        toast.showError(msg);
      }
    } catch (e) {
      toast.showError(t('toasts.redeemFailedTryLater'));
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div
      className="balance-card"
      style={{
        position: 'relative',
        borderRadius: '14px',
        padding: 0,
        marginTop: '24px',
        background: 'linear-gradient(135deg, rgba(121,74,255,0.14), rgba(20,20,20,0.9))',
        border: '1px solid rgba(121,74,255,0.25)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '14px',
          background: 'radial-gradient(1200px 200px at 10% -10%, rgba(121,74,255,0.18), transparent), radial-gradient(800px 200px at 90% 110%, rgba(255,193,7,0.08), transparent)'
        }}
      />

      <div style={{ position: 'relative', padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(255,193,7,0.18), rgba(255,193,7,0.10))',
              border: '1px solid rgba(255,193,7,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FiGift size={20} color="#ffc107" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 16 }}>{t('dashboard.redeem.title')}</h3>
              <div style={{ color: '#9aa0a6', fontSize: 12 }}>{t('dashboard.redeem.format')}</div>
            </div>
          </div>
        </div>

        {/* full-width horizontal form row */}
        <div style={{ width: '100%', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder={t('dashboard.redeem.placeholder')}
                value={redeemCode}
                onChange={(e) => setRedeemCode(toUpperSafe(e.target.value))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRedeem(); }}
                style={{
                  width: '100%',
                  padding: '16px 112px 16px 16px',
                  background: 'rgba(10,10,10,0.9)',
                  border: `1px solid ${isValidish || redeemCode.length === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,68,68,0.6)'}`,
                  outline: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 16,
                  letterSpacing: 1,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                }}
              />
              <div style={{ position: 'absolute', right: 10, top: 10, display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handlePaste}
                  title={t('dashboard.redeem.paste')}
                  style={{
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#ddd',
                    borderRadius: 10,
                    padding: '10px 12px',
                    cursor: 'pointer'
                  }}
                >
                  <FiClipboard size={16} />
                </button>
                {redeemCode && (
                  <button
                    type="button"
                    onClick={handleClear}
                    title={t('dashboard.redeem.clear')}
                    style={{
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#ddd',
                      borderRadius: 10,
                      padding: '10px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={handleRedeem}
              disabled={!redeemCode || isRedeeming}
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                border: 'none',
                flex: '0 0 180px',
                background: redeemCode && !isRedeeming ? 'linear-gradient(135deg, #ffc107 0%, #ffb300 100%)' : 'linear-gradient(135deg, #2a2a2a 0%, #222 100%)',
                color: redeemCode && !isRedeeming ? '#000' : '#888',
                fontSize: 15,
                fontWeight: 800,
                cursor: redeemCode && !isRedeeming ? 'pointer' : 'not-allowed',
                boxShadow: redeemCode && !isRedeeming ? '0 8px 22px rgba(255,193,7,0.28)' : 'none',
                transition: 'all .2s ease'
              }}
            >
              {isRedeeming ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <FiLoader size={16} /> {t('dashboard.redeem.redeeming')}
                </span>
              ) : t('dashboard.redeem.redeem')}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, color: isValidish || redeemCode.length === 0 ? '#9aa0a6' : '#ff6b6b', fontSize: 12 }}>
          {redeemCode.length === 0
            ? t('dashboard.redeem.tipEmpty')
            : (isValidish ? t('dashboard.redeem.tipLooksGood') : t('dashboard.redeem.tipInvalid'))}
        </div>
      </div>
    </div>
  );
}
