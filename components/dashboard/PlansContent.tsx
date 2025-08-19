"use client";

import { useState, useEffect } from "react";
import { FiCheck, FiAlertTriangle, FiX } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import ModalPortal from "@/components/common/ModalPortal";

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
    packageName: apiData?.package_snapshot?.name || apiData?.package_name,
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
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewPackage, setRenewPackage] = useState<Package | null>(null);

  // Define package hierarchy
  const packageHierarchy: { [key: string]: number } = {
    'basic': 1,
    'professional': 2,
    'enterprise': 3
  };

  // Get package level from name
  const getPackageLevel = (packageName: string): number => {
    const lowerName = packageName?.toLowerCase();

    // Check for English names
    if (lowerName?.includes('basic')) return packageHierarchy.basic;
    if (lowerName?.includes('professional')) return packageHierarchy.professional;
    if (lowerName?.includes('enterprise')) return packageHierarchy.enterprise;

    // Check for Chinese names
    if (packageName?.includes('基础版')) return packageHierarchy.basic;
    if (packageName?.includes('专业版')) return packageHierarchy.professional;
    if (packageName?.includes('企业版')) return packageHierarchy.enterprise;

    return 0;
  };

  // Determine button text based on package comparison
  const getButtonText = (pkg: Package): string => {


    if (!currentPackage) return 'Choose Plan';

    if (currentPackage.packageId === pkg.id) {
      return 'Renew';
    }

    const currentLevel = getPackageLevel(currentPackage.packageName);
    const targetLevel = getPackageLevel(pkg.name);
    console.log(targetLevel, currentLevel);

    if (targetLevel > currentLevel) {
      return 'Upgrade';
    }

    return 'Choose Plan';
  };

  // Determine if button should be disabled
  const isButtonDisabled = (pkg: Package): boolean => {
    return false; // No packages are disabled, all can be selected
  };


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
        console.log(data.data.currentPackage);

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

    const buttonText = getButtonText(pkg);

    if (buttonText === 'Renew') {
      // Handle renewal - could redirect to renewal flow or show renewal modal
      handleRenewal(pkg);
    } else {
      // Handle upgrade or new purchase
      setSelectedPackage(pkg);
      setShowConfirmModal(true);
    }
  };

  // Handle package renewal - show renewal modal
  const handleRenewal = (pkg: Package) => {
    setRenewPackage(pkg);
    setShowRenewModal(true);
    setSelectedMonths(1);
  };

  // Confirm renewal and process the renewal
  const confirmRenew = async () => {
    if (isRenewing || !renewPackage) return;
    
    setIsRenewing(true);
    
    try {
      const response = await fetch('/api/packages/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          months: selectedMonths
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(`Package renewed successfully for ${selectedMonths} month(s)!`);
        setShowRenewModal(false);
        // Refresh packages data
        await fetchPackages();
      } else {
        showError(data.error?.message || 'Failed to renew package');
      }
    } catch (error) {
      showError('Renewal failed, please try again');
    } finally {
      setIsRenewing(false);
    }
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
                  disabled={isButtonDisabled(pkg)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: (() => {
                      const buttonText = getButtonText(pkg);
                      if (buttonText === 'Renew') {
                        return 'linear-gradient(135deg, #00d084 0%, #00b377 100%)';
                      } else if (buttonText === 'Upgrade') {
                        return 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)';
                      } else if (pkg.is_recommended) {
                        return 'linear-gradient(135deg, #ff4444 0%, #ff6666 100%)';
                      } else {
                        return 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)';
                      }
                    })(),
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isButtonDisabled(pkg) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isButtonDisabled(pkg)) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(121, 74, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {getButtonText(pkg)}
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

            <h3 style={{ color: '#fff', marginBottom: '24px' }}>
              {selectedPackage && getButtonText(selectedPackage) === 'Upgrade' ? 'Confirm Upgrade' : 'Confirm Purchase'}
            </h3>

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

      {/* Renewal Modal */}
      <ModalPortal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        title="Renew Your Package"
        maxWidth="480px"
      >
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <p style={{ 
            color: '#b3b3b3', 
            marginBottom: '20px',
            fontSize: '15px',
            textAlign: 'center'
          }}>
            Select your renewal period
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '12px',
            marginBottom: '20px'
          }}>
            {[1, 3, 6, 12].map((months) => (
              <button
                key={months}
                onClick={() => setSelectedMonths(months)}
                className={`renewal-month-btn ${selectedMonths === months ? 'selected' : ''}`}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: selectedMonths === months 
                    ? '2px solid #00d084' 
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  background: selectedMonths === months 
                    ? 'linear-gradient(135deg, rgba(0, 208, 132, 0.15) 0%, rgba(0, 208, 132, 0.05) 100%)' 
                    : 'rgba(255, 255, 255, 0.02)',
                  color: selectedMonths === months ? '#00d084' : '#fff',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                  {months}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {months === 1 ? 'Month' : 'Months'}
                </div>
                {months === 6 && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'linear-gradient(135deg, #ff4444, #ff6666)',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    POPULAR
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(121, 74, 255, 0.1) 0%, rgba(121, 74, 255, 0.05) 100%)',
            border: '1px solid rgba(121, 74, 255, 0.2)',
            borderRadius: '10px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <span style={{ color: '#999', fontSize: '14px' }}>
                Selected Duration
              </span>
              <span style={{ 
                color: '#fff', 
                fontSize: '18px', 
                fontWeight: '700',
                background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {selectedMonths} {selectedMonths === 1 ? 'Month' : 'Months'}
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <span style={{ color: '#999', fontSize: '14px' }}>
                New Expiry Date
              </span>
              <span style={{ 
                color: '#00d084', 
                fontSize: '15px', 
                fontWeight: '600'
              }}>
                {(() => {
                  const currentEnd = currentPackage?.endDate ? new Date(currentPackage.endDate) : new Date();
                  const newEnd = new Date(currentEnd);
                  newEnd.setMonth(newEnd.getMonth() + selectedMonths);
                  return newEnd.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  });
                })()}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowRenewModal(false)}
            className="modal-cancel-btn"
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'transparent',
              color: '#999',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Cancel
          </button>
          <button
            onClick={confirmRenew}
            disabled={isRenewing}
            className="modal-confirm-btn"
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #00d084 0%, #00b377 100%)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: isRenewing ? 'not-allowed' : 'pointer',
              opacity: isRenewing ? 0.6 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(0, 208, 132, 0.3)'
            }}
          >
            {isRenewing ? 'Processing...' : 'Confirm Renewal'}
          </button>
        </div>
      </ModalPortal>
    </>
  );
}