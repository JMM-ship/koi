"use client";

import { useState, useEffect } from "react";
import { FiCheck, FiAlertTriangle, FiX } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

interface Package {
  id: string;
  name: string;
  name_en?: string;
  price: number;
  original_price?: number;
  daily_credits: number;
  valid_days: number;
  features?: string[];
  tag?: string;
  is_recommended: boolean;
  currency: string;
  plan_type: string
}

interface UserPackage {
  id: string;
  packageId: string;
  packageName: string;
  endDate: string;
  dailyCredits: number;
  remainingDays: number;
}

function fromApiUserPackage(apiData: any): UserPackage {
  return {
    id: apiData?.id,
    packageId: apiData?.package_id,
    packageName: apiData?.package_name,
    endDate: apiData?.end_date,
    dailyCredits: apiData?.daily_credits,
    remainingDays: apiData?.remaining_days,
  };
}

export default function PlansContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [currentPackage, setCurrentPackage] = useState<UserPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [purchasing, setPurchasing] = useState(false);


  // Get packages list
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages');
      const data = await response.json()


      if (data.success && data.data?.packages?.length > 0) {
        // Convert price from cents to yuan
        const packagesData = data.data.packages.map((pkg: any) => ({
          ...pkg,
          price: pkg.price / 100,
          original_price: pkg.original_price ? pkg.original_price / 100 : undefined
        }));
        setPackages(packagesData);
        setCurrentPackage(fromApiUserPackage(data.data.currentPackage));
      }
    } catch (error) {
      showError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  // Handle purchase button click
  const handlePurchase = (pkg: Package) => {
    if (!session) {
      showWarning('Please login first');
      router.push('/signin');
      return;
    }

    setSelectedPackage(pkg);
    setShowConfirmModal(true);
  };

  // Confirm purchase
  const confirmPurchase = async () => {
    if (!selectedPackage || purchasing) return;

    setPurchasing(true);

    try {
      // Create order
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderType: 'package',
          packageId: selectedPackage.id,
          paymentMethod: 'mock' // Mock payment
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Simulate payment success
        await simulatePaymentSuccess(data.data.order.orderNo);

        showSuccess('Package purchased successfully!');
        setShowConfirmModal(false);

        // Refresh page data
        await fetchPackages();
      } else {
        showError(data.error?.message || 'Failed to create order');
      }
    } catch (error) {
      showError('Purchase failed, please try again');
    } finally {
      setPurchasing(false);
    }
  };

  // Simulate payment success (development only)
  const simulatePaymentSuccess = async (orderNo: string) => {
    const response = await fetch('/api/orders/pay/mock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderNo,
        paymentDetails: {
          method: 'mock',
          transactionId: 'mock_' + Date.now(),
          paidAt: new Date().toISOString()
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Payment processing failed');
    }
  };

  // Format package features
  const formatFeatures = (pkg: Package) => {
    if (pkg.features && pkg.features.length > 0) {
      return pkg.features;
    }

    // Generate default features based on package info
    return [
      `${pkg.daily_credits.toLocaleString()} credits daily`,
      'Full speed response',
      'Support all AI models',
      'Technical support service',
      `${pkg.valid_days} days validity`
    ];
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-header mb-4">
        <div className="text-center">
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
            Pricing Plans
          </h1>
          <p style={{ fontSize: '16px', color: '#999', marginBottom: '12px' }}>
            Base plan $200 Max account, monthly pricing is 28% of base, best value
          </p>

          {/* {currentPackage && (
            <div style={{
              background: 'rgba(0, 208, 132, 0.1)',
              border: '1px solid rgba(0, 208, 132, 0.2)',
              borderRadius: '8px',
              padding: '12px 24px',
              marginBottom: '24px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              maxWidth: '600px'
            }}>
              <FiCheck style={{ color: '#00d084', fontSize: '18px', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#00d084', textAlign: 'left' }}>
                Current plan: <strong>{currentPackage.packageName}</strong>,
                {currentPackage.remainingDays} days remaining
              </span>
            </div>
          )} */}

          <div style={{
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.2)',
            borderRadius: '8px',
            padding: '12px 24px',
            marginBottom: '32px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            maxWidth: '800px'
          }}>
            <FiAlertTriangle style={{ color: '#ffc107', fontSize: '18px', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: '#ffc107', textAlign: 'left' }}>
              <strong>Important:</strong> During subscription period, the pricing will follow Claude's official adjustments (non-member, non-platform pricing)
            </span>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        {packages.map((pkg) => {
          return pkg.plan_type !== "credits" ? (
            <div key={pkg.id} className="col-lg-4 mb-4">
              <div className="balance-card" style={{
                background: '#0a0a0a',
                border: pkg.is_recommended ? '2px solid #ff4444' : '1px solid #1a1a1a',
                borderRadius: '12px',
                padding: '24px',
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s',
                ...(pkg.is_recommended && {
                  transform: 'scale(1.05)',
                  boxShadow: '0 8px 24px rgba(255, 68, 68, 0.2)'
                })
              }}>
                {pkg.is_recommended && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#ff4444',
                    color: '#fff',
                    padding: '6px 24px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}>
                    🔥 Most Popular
                  </div>
                )}

                {pkg.tag && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: pkg.tag === 'HOT'
                      ? 'linear-gradient(135deg, #ff4444 0%, #ff6666 100%)'
                      : 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {pkg.tag}
                  </div>
                )}

                <div className="text-center mb-4" style={{ paddingTop: pkg.is_recommended ? '20px' : '0' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#999',
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {pkg.name_en || pkg.name}
                  </h3>

                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '52px', fontWeight: '700', color: '#fff', lineHeight: 1 }}>
                        ¥{pkg.price}
                      </span>
                      <span style={{ fontSize: '16px', color: '#666' }}>
                        /month
                      </span>
                    </div>
                    {pkg.original_price && (
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#666', textDecoration: 'line-through' }}>
                          Original ¥{pkg.original_price}/month
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: '#ff4444',
                          marginLeft: '8px',
                          fontWeight: '600',
                          background: 'rgba(255, 68, 68, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          Save {Math.round((1 - pkg.price / pkg.original_price) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <ul className="list-unstyled" style={{ flex: 1, marginBottom: '24px' }}>
                  {formatFeatures(pkg).map((feature, index) => (
                    <li key={index} className="d-flex align-items-start" style={{ marginBottom: '14px' }}>
                      <span style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 208, 132, 0.15)',
                        marginRight: '10px',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}>
                        <FiCheck style={{
                          fontSize: '11px',
                          color: '#00d084',
                          fontWeight: 'bold'
                        }} />
                      </span>
                      <span style={{
                        fontSize: '13px',
                        color: '#e0e0e0',
                        lineHeight: '1.5'
                      }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={currentPackage?.packageId === pkg.id}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: currentPackage?.packageId === pkg.id
                      ? '#333'
                      : pkg.is_recommended
                        ? 'linear-gradient(135deg, #ff4444 0%, #ff6666 100%)'
                        : 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: currentPackage?.packageId === pkg.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPackage?.packageId !== pkg.id) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(121, 74, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {currentPackage?.packageId === pkg.id ? 'Current Plan' : 'Choose Plan'}
                </button>
              </div>
            </div>
          ) : null
        })}
      </div>

      <div className="text-center mt-5">
        <div style={{
          background: 'rgba(121, 74, 255, 0.05)',
          border: '1px solid rgba(121, 74, 255, 0.15)',
          borderRadius: '12px',
          padding: '20px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', textAlign: 'left' }}>
            <span style={{ fontSize: '20px' }}>💡</span>
            <div>
              <p style={{ fontSize: '14px', color: '#fff', marginBottom: '8px', fontWeight: '500' }}>
                Daily refresh reminder: The quota will be consumed during the morning refresh. This helps you see the latest updates from Claude official and completes the login process.
              </p>
              <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>
                We handle the tedious login work for you automatically
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm purchase modal */}
      {showConfirmModal && selectedPackage && (
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
          zIndex: 9999
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            position: 'relative',
            border: '1px solid #333'
          }}>
            <button
              onClick={() => setShowConfirmModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <FiX size={20} />
            </button>

            <h3 style={{ color: '#fff', marginBottom: '24px' }}>Confirm Purchase</h3>

            <div style={{
              background: '#0a0a0a',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h4 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px' }}>
                {selectedPackage.name_en || selectedPackage.name}
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#999' }}>Price</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>¥{selectedPackage.price}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#999' }}>Daily Credits</span>
                <span style={{ color: '#fff' }}>{selectedPackage.daily_credits.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#999' }}>Validity</span>
                <span style={{ color: '#fff' }}>{selectedPackage.valid_days} days</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  background: 'transparent',
                  color: '#999',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                disabled={purchasing}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: purchasing ? 'not-allowed' : 'pointer',
                  opacity: purchasing ? 0.6 : 1
                }}
              >
                {purchasing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}