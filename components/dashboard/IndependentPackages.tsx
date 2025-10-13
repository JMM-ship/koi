"use client";

import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import useSWR, { useSWRConfig } from "swr";
import PaymentMethodModal from "@/components/dashboard/PaymentMethodModal";

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
  const { mutate } = useSWRConfig();
  const { data: packagesResp } = useSWR('/api/packages/credits', async (url: string) => {
    const res = await fetch(url)
    return res.json()
  })
  const packages: Package[] = (packagesResp?.data?.packages || []) as Package[]
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [pendingOrderNo, setPendingOrderNo] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const loading = !packagesResp;
  const paymentProvider = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'mock';

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

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    const loadingToast = showLoading('Processing purchase request...');

    try {
      const selected = packages.find(pkg => pkg.id === selectedPackage);
      if (!selected) {
        dismiss(loadingToast);
        showError('Please select a credit package');
        setIsProcessing(false);
        return;
      }

      // Create order first
      const createOrderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderType: 'credits',
          creditAmount: selected.credits,
          packageId: selected.id,
          paymentMethod: 'pending', // 暂时设置为pending,等用户选择
        }),
      });

      const orderData = await createOrderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error?.message || 'Failed to create order');
      }

      const orderNo = orderData.data.order.orderNo as string;

      // 保存订单号,关闭加载提示,打开支付方式选择modal
      dismiss(loadingToast);
      setPendingOrderNo(orderNo);
      setShowPaymentMethodModal(true);
    } catch (error) {
      dismiss();
      console.error("Purchase failed:", error);
      showError(error instanceof Error ? error.message : 'Purchase failed, please try again later');
      setIsProcessing(false);
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = async (method: 'stripe' | 'antom') => {
    if (!pendingOrderNo || processingPayment) return;

    setProcessingPayment(true);

    try {
      if (method === 'stripe') {
        // Create Stripe Checkout session and redirect
        const payResp = await fetch('/api/orders/pay/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNo: pendingOrderNo }),
        });
        const payData = await payResp.json();
        if (!payResp.ok || !payData?.success || !payData?.data?.checkoutUrl) {
          throw new Error(payData?.error?.message || 'Failed to create Stripe checkout session');
        }
        window.location.href = payData.data.checkoutUrl;
        return; // Redirecting
      } else if (method === 'antom') {
        // Create Antom payment and redirect
        const payResp = await fetch('/api/orders/pay/antom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNo: pendingOrderNo }),
        });
        const payData = await payResp.json();
        if (!payResp.ok || !payData?.success || !payData?.data?.redirectUrl) {
          throw new Error(payData?.error?.message || 'Failed to create Antom payment');
        }
        window.location.href = payData.data.redirectUrl;
        return; // Redirecting
      }
    } catch (error: any) {
      showError(error.message || 'Payment failed, please try again');
      setProcessingPayment(false);
      setShowPaymentMethodModal(false);
      setPendingOrderNo(null);
      setIsProcessing(false);
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
          Choose Your Package
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
          Loading packages...
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
                Credits
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

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={!selectedPackage || isProcessing}
        style={{
          background: selectedPackage && !isProcessing
            ? 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)'
            : '#333',
          border: 'none',
          borderRadius: '0.375rem',
          padding: '0.625rem',
          color: selectedPackage && !isProcessing ? '#fff' : '#666',
          fontSize: '0.8125rem',
          fontWeight: '600',
          cursor: selectedPackage && !isProcessing ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s',
          width: '100%'
        }}
        onMouseEnter={(e) => {
          if (selectedPackage && !isProcessing) {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (selectedPackage && !isProcessing) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {isProcessing ? 'Processing...' : selectedPackage ? 'Purchase Now' : 'Select a Package'}
      </button>

      {/* Payment Method Selection Modal */}
      <PaymentMethodModal
        isOpen={showPaymentMethodModal}
        onClose={() => {
          setShowPaymentMethodModal(false);
          setPendingOrderNo(null);
          setIsProcessing(false);
          setProcessingPayment(false);
        }}
        onSelectMethod={handlePaymentMethodSelect}
        processing={processingPayment}
      />
    </div>
  );
};

export default IndependentPackages;
