"use client";

import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import useSWR, { useSWRConfig } from "swr";
import { SiStripe, SiAlipay } from "react-icons/si";

interface Package {
  id: string;
  name: string;
  credits: number;
  price: number; // already in base currency units (e.g., 1 = $1)
  originalPrice?: number;
  popular?: boolean;
  description: string;
  savings?: string;
  tag?: string;
  currency?: string; // e.g., 'USD', optional from API
}

interface IndependentPackagesProps {
  onBack: () => void;
  onPurchase?: () => void;
}

const IndependentPackages = ({ onBack, onPurchase }: IndependentPackagesProps) => {
  const { showSuccess, showError, showLoading, dismiss } = useToast();
  const { t } = useT()
  const { mutate } = useSWRConfig();
  const { data: packagesResp } = useSWR('/api/packages/credits', async (url: string) => {
    const res = await fetch(url)
    return res.json()
  })
  const packages: Package[] = (packagesResp?.data?.packages || []) as Package[]
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [processingStripe, setProcessingStripe] = useState(false);
  const [processingAntom, setProcessingAntom] = useState(false);
  const loading = !packagesResp;

  const currencySymbol = (cur?: string) => {
    switch ((cur || 'USD').toUpperCase()) {
      case 'USD':
        return '$';
      case 'CNY':
      case 'RMB':
        return '¥';
      case 'EUR':
        return '€';
      default:
        return '$';
    }
  };

  // Data fetching moved to SWR above to enable persisted cache-first rendering

  const handlePurchase = async (method: 'stripe' | 'antom') => {
    if (!selectedPackage) {
      showError(t('toasts.selectCreditPackage'));
      return;
    }

    // Set processing state for the clicked button
    if (method === 'stripe') {
      setProcessingStripe(true);
    } else {
      setProcessingAntom(true);
    }

    const loadingToast = showLoading(t('toasts.processingPurchaseRequest'));

    try {
      const selected = packages.find(pkg => pkg.id === selectedPackage);
      if (!selected) {
        dismiss(loadingToast);
        showError(t('toasts.selectCreditPackage'));
        setProcessingStripe(false);
        setProcessingAntom(false);
        return;
      }

      // Create order
      const createOrderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderType: 'credits',
          creditAmount: selected.credits,
          packageId: selected.id,
          paymentMethod: method,
        }),
      });

      const orderData = await createOrderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error?.message || t('toasts.failedCreateOrder'));
      }

      const orderNo = orderData.data.order.orderNo as string;

      // Process payment immediately
      if (method === 'stripe') {
        const payResp = await fetch('/api/orders/pay/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNo }),
        });
        const payData = await payResp.json();
        if (!payResp.ok || !payData?.success || !payData?.data?.checkoutUrl) {
          throw new Error(payData?.error?.message || t('toasts.failedStripeCheckout'));
        }
        dismiss(loadingToast);
        window.location.href = payData.data.checkoutUrl;
        return;
      } else if (method === 'antom') {
        const payResp = await fetch('/api/orders/pay/antom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNo }),
        });
        const payData = await payResp.json();
        if (!payResp.ok || !payData?.success || !payData?.data?.redirectUrl) {
          throw new Error(payData?.error?.message || t('toasts.failedAntomPayment'));
        }
        dismiss(loadingToast);
        window.location.href = payData.data.redirectUrl;
        return;
      }
    } catch (error) {
      dismiss();
      console.error("Purchase failed:", error);
      showError(error instanceof Error ? error.message : t('toasts.purchaseFailedRetry'));
      setProcessingStripe(false);
      setProcessingAntom(false);
    }
  };

  return (
    <div className="balance-card" style={{
      background: '#0a0a0a',
      border: '1px solid #1a1a1a',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s',
      height: '100%',
      minHeight: '400px'
    }}>
      {/* Header with back button */}
      <div className="d-flex align-items-center" style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#999',
            cursor: 'pointer',
            padding: '0.5rem',
            marginRight: '0.5rem',
            borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1a1a1a';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#999';
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#fff', margin: 0 }}>
          {t('packages.chooseYourPackage')}
        </h3>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '250px',
          color: '#999'
        }}>
          {t('packages.loadingPackages')}
        </div>
      )}

      {/* Package Grid */}
      {!loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, minmax(100px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem',
          flex: 1,
          minHeight: '250px'
        }}>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              style={{
                background: selectedPackage === pkg.id
                  ? 'linear-gradient(135deg, rgba(255, 165, 0, 0.15), rgba(255, 140, 0, 0.15))'
                  : '#111111',
                border: selectedPackage === pkg.id
                  ? '2px solid #ffa500'
                  : '1px solid #2a2a2a',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: '100px'
              }}
              onMouseEnter={(e) => {
                if (selectedPackage !== pkg.id) {
                  e.currentTarget.style.borderColor = '#3a3a3a';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPackage !== pkg.id) {
                  e.currentTarget.style.borderColor = '#2a2a2a';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {pkg.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #ffa500, #ff8c00)',
                  color: '#000',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.5rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}>
                  Popular
                </div>
              )}

              {selectedPackage === pkg.id && (
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffa500, #ff8c00)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Check size={12} color="#000" strokeWidth={3} />
                </div>
              )}

              <div style={{ fontSize: '0.625rem', color: '#999', marginBottom: '0.25rem' }}>
                {pkg.name}
              </div>

              <div style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: '#ffa500',
                marginBottom: '0.25rem'
              }}>
                {pkg.credits >= 1000 ? `${(pkg.credits / 1000)}k` : pkg.credits}
              </div>

              <div style={{ fontSize: '0.5rem', color: '#666', marginBottom: '0.5rem' }}>
                {t('packages.credits')}
              </div>

              <div style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '0.25rem'
              }}>
                {currencySymbol(pkg.currency)}{(pkg.price).toFixed(2)}
              </div>

              {pkg.originalPrice && (
                <div style={{
                  fontSize: '0.625rem',
                  color: '#666',
                  textDecoration: 'line-through',
                  marginBottom: '0.25rem'
                }}>
                  {currencySymbol(pkg.currency)}{(pkg.originalPrice).toFixed(2)}
                </div>
              )}

              {pkg.savings && (
                <div style={{
                  fontSize: '0.5rem',
                  color: '#4ade80',
                  fontWeight: '600'
                }}>
                  {pkg.savings}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem'
      }}>
        {/* Stripe Card Payment Button */}
        <button
          onClick={() => handlePurchase('stripe')}
          disabled={!selectedPackage || processingStripe || processingAntom}
          style={{
            background: selectedPackage && !processingStripe && !processingAntom
              ? 'linear-gradient(135deg, rgba(99, 91, 255, 0.2) 0%, rgba(99, 91, 255, 0.1) 100%)'
              : '#333',
            border: selectedPackage && !processingStripe && !processingAntom
              ? '2px solid rgba(99, 91, 255, 0.5)'
              : '1px solid #2a2a2a',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            color: selectedPackage && !processingStripe && !processingAntom ? '#fff' : '#666',
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: selectedPackage && !processingStripe && !processingAntom ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.375rem'
          }}
          onMouseEnter={(e) => {
            if (selectedPackage && !processingStripe && !processingAntom) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 91, 255, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedPackage && !processingStripe && !processingAntom) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <SiStripe size={24} style={{ color: selectedPackage && !processingStripe && !processingAntom ? '#635BFF' : '#666' }} />
          <span>{processingStripe ? t('packages.processing') : t('packages.cardPayment')}</span>
        </button>

        {/* Antom E-Wallet Payment Button */}
        <button
          onClick={() => handlePurchase('antom')}
          disabled={!selectedPackage || processingStripe || processingAntom}
          style={{
            background: selectedPackage && !processingStripe && !processingAntom
              ? 'linear-gradient(135deg, rgba(0, 208, 132, 0.2) 0%, rgba(0, 208, 132, 0.1) 100%)'
              : '#333',
            border: selectedPackage && !processingStripe && !processingAntom
              ? '2px solid rgba(0, 208, 132, 0.5)'
              : '1px solid #2a2a2a',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            color: selectedPackage && !processingStripe && !processingAntom ? '#fff' : '#666',
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: selectedPackage && !processingStripe && !processingAntom ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.375rem'
          }}
          onMouseEnter={(e) => {
            if (selectedPackage && !processingStripe && !processingAntom) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 208, 132, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedPackage && !processingStripe && !processingAntom) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <SiAlipay size={24} style={{ color: selectedPackage && !processingStripe && !processingAntom ? '#00d084' : '#666' }} />
          <span>{processingAntom ? t('packages.processing') : t('packages.eWallet')}</span>
        </button>
      </div>
    </div>
  );
};

export default IndependentPackages;
