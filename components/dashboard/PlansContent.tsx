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
  version: string;
  description?: string;
  priceCents: number; // 数据库字段名
  price: number; // 计算后的价格（元）
  currency: string;
  dailyPoints: number; // 数据库字段名
  daily_credits: number; // 展示用字段
  planType: string; // 数据库字段名
  plan_type: string; // 展示用字段
  validDays?: number; // 数据库字段名
  valid_days: number; // 展示用字段
  features?: any; // JSON 字段
  limitations?: any; // JSON 字段
  isActive: boolean;
  sortOrder: number;
  tag?: string; // 展示用
  is_recommended: boolean; // 展示用
  createdAt: string;
  updatedAt: string;
}

interface UserPackage {
  id: string;
  userId: string;
  packageId: string;
  orderId?: string;
  startAt: string;
  endAt: string;
  dailyPoints: number;
  dailyQuotaTokens: string; // BigInt 作为字符串
  isActive: boolean;
  packageSnapshot: any; // JSON 字段
  // 展示用字段
  packageName: string;
  endDate: string;
  dailyCredits: number;
  remainingDays: number;
  createdAt: string;
  updatedAt: string;
}

function fromApiUserPackage(apiData: any): UserPackage {
  let diffDays = 0;

  if (apiData?.start_date && apiData?.end_date) {
    const start = new Date(apiData.start_date);
    const end = new Date(apiData.end_date);

    const diffMs = end.getTime() - start.getTime(); // 毫秒差
    diffDays = diffMs / (1000 * 60 * 60 * 24); // 转换成天数
  }

  return {
    id: apiData?.id,
    userId: apiData?.user_id,
    packageId: apiData?.package_id,
    orderId: apiData?.order_no,
    startAt: apiData?.start_date,
    endAt: apiData?.end_date,
    dailyPoints: apiData?.daily_credits, // 映射 daily_credits -> dailyPoints
    dailyQuotaTokens: apiData?.daily_quota_tokens, // 如果后端有
    isActive: apiData?.is_active,
    packageSnapshot: apiData?.package_snapshot,
    // 展示用字段
    packageName: apiData?.package_snapshot?.name || apiData?.package?.name,
    endDate: apiData?.end_date,
    dailyCredits: apiData?.daily_credits,
    remainingDays: diffDays,
    createdAt: apiData?.created_at,
    updatedAt: apiData?.updated_at,
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
  const [upgradeDiscount, setUpgradeDiscount] = useState<{ amount: number, days: number } | null>(null);
  const paymentProvider = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'mock';

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

    console.log(pkg, "当前包", currentPackage);

    if (!currentPackage) return 'Choose Plan';

    if (currentPackage.packageId === pkg.id) {
      return 'Renew';
    }

    const currentLevel = getPackageLevel(currentPackage.packageName);
    const targetLevel = getPackageLevel(pkg.name);

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
          price: pkg.priceCents / 100,
          daily_credits: pkg.dailyPoints,
          valid_days: pkg.validDays,
          plan_type: pkg.planType,
          is_recommended: (pkg.features?.isRecommended === true),
        }));
        setPackages(packagesData);
        console.log(data.data, "数据的数据");


        setCurrentPackage(fromApiUserPackage(data.data.currentPackage));
      }
    } catch (error) {
      showError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  // Calculate upgrade discount based on remaining days
  const calculateUpgradeDiscount = (targetPackage: Package) => {
    if (!currentPackage || !targetPackage) return null;

    console.log("=== 开始计算升级优惠 ===");
    console.log("目标套餐:", targetPackage);

    const currentLevel = getPackageLevel(currentPackage.packageName);
    const targetLevel = getPackageLevel(targetPackage.name);
    console.log("当前套餐等级:", currentLevel, "目标套餐等级:", targetLevel);

    // 只对升级生效
    if (targetLevel <= currentLevel) {
      console.log("目标套餐不高于当前套餐 → 不适用优惠");
      return null;
    }

    const remainingDays = currentPackage.remainingDays || 0;
    console.log("剩余天数:", remainingDays);

    if (remainingDays <= 0) {
      console.log("剩余天数 <= 0 → 不适用优惠");
      return null;
    }

    const currentPkg = packages.find(p => p.id === currentPackage.packageId);
    if (!currentPkg) {
      console.log("未找到当前套餐详情 → 不适用优惠");
      return null;
    }

    console.log("当前套餐详情:", currentPkg);

    const dailyRate = currentPkg.price / 30;
    console.log("当前套餐日均价格:", dailyRate);

    const remainingValue = Math.floor(dailyRate * remainingDays);
    console.log("剩余价值:", remainingValue);

    const discountAmount = Math.min(remainingValue * 0.5, targetPackage.price * 0.2);
    console.log("计算出的优惠金额:", discountAmount);

    console.log("=== 计算完成 ===");

    return {
      amount: Math.floor(discountAmount),
      days: remainingDays
    };
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
    } else if (buttonText === 'Upgrade') {
      // Calculate discount for upgrade
      console.log(buttonText);

      const discount = calculateUpgradeDiscount(pkg);
      setUpgradeDiscount(discount);

      setSelectedPackage(pkg);
      setShowConfirmModal(true);
    } else {
      // Handle new purchase
      setUpgradeDiscount(null);
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
          months: selectedMonths,
          packageId: renewPackage.id
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
          paymentMethod: paymentProvider,
          upgradeDiscount: upgradeDiscount ? upgradeDiscount.amount : 0
        }),
      });

      const data = await response.json();

      if (data.success) {
        const orderNo = data.data.order.orderNo as string;
        if (paymentProvider === 'antom') {
          // Create Antom payment and redirect
          const payResp = await fetch('/api/orders/pay/antom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderNo }),
          });
          const payData = await payResp.json();
          if (!payResp.ok || !payData?.success || !payData?.data?.redirectUrl) {
            throw new Error(payData?.error?.message || 'Failed to create Antom payment');
          }
          window.location.href = payData.data.redirectUrl;
          return; // Redirecting, skip local success toast for now
        } else {
          // Simulate payment success (mock)
          await simulatePaymentSuccess(orderNo);
        }

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
    console.log(pkg.daily_credits, "日用");

    return [
      `${pkg.daily_credits?.toLocaleString()} credits daily`,
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
                    {pkg.name}
                  </h3>

                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '52px', fontWeight: '700', color: '#fff', lineHeight: 1 }}>
                        ${pkg.price}
                      </span>
                      <span style={{ fontSize: '16px', color: '#666' }}>
                        /month
                      </span>
                    </div>
                  </div>
                </div>

                <ul className="list-unstyled" style={{ flex: 1, marginBottom: '24px' }}>
                  {formatFeatures(pkg).map((feature: any, index: any) => (
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
                {selectedPackage.name}
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#999' }}>Original Price</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>${selectedPackage.price}</span>
              </div>

              {upgradeDiscount && (
                <>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    padding: '8px',
                    background: 'rgba(0, 208, 132, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 208, 132, 0.2)'
                  }}>
                    <span style={{ color: '#00d084', fontSize: '14px' }}>
                      Upgrade Discount ({upgradeDiscount.days} days remaining)
                    </span>
                    <span style={{ color: '#00d084', fontWeight: 'bold' }}>-${upgradeDiscount.amount}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #333'
                  }}>
                    <span style={{ color: '#fff', fontWeight: '600' }}>Final Price</span>
                    <span style={{
                      color: '#00d084',
                      fontWeight: 'bold',
                      fontSize: '20px'
                    }}>
                      ${selectedPackage.price - upgradeDiscount.amount}
                    </span>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#999' }}>Daily Credits</span>
                <span style={{ color: '#fff' }}>{selectedPackage.daily_credits.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#999' }}>Validity</span>
                <span style={{ color: '#fff' }}>{selectedPackage.valid_days} days</span>
              </div>
            </div>

            {upgradeDiscount && (
              <div style={{
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.2)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FiAlertTriangle style={{ color: '#ffc107', fontSize: '16px', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#ffc107' }}>
                  Your remaining {upgradeDiscount.days} days from current plan has been converted to a discount
                </span>
              </div>
            )}

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
