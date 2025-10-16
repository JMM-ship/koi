"use client";

import { useState, useEffect } from "react";
import useSWR from 'swr'
import { FiCheck, FiAlertTriangle, FiX } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import ModalPortal from "@/components/common/ModalPortal";
import RedeemCodeCard from "@/components/dashboard/RedeemCodeCard";
import PaymentMethodModal from "@/components/dashboard/PaymentMethodModal";

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
  const { t } = useT()
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewPackage, setRenewPackage] = useState<Package | null>(null);
  const [upgradeDiscount, setUpgradeDiscount] = useState<{ amount: number, days: number } | null>(null);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [pendingOrderNo, setPendingOrderNo] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const paymentProvider = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'mock';
  // Fetch packages via SWR for cache-first behavior
  const { data: packagesResp, mutate: mutatePackages } = useSWR('/api/packages', async (url: string) => {
    const res = await fetch(url)
    return res.json()
  })
  const loading = !packagesResp
  const packages: Package[] = ((packagesResp?.data?.packages || []) as any[]).map((pkg: any) => {
    const mappedName = (() => {
      const pt = (pkg.planType || '').toLowerCase()
      if (pt === 'basic') return 'Plus'
      if (pt === 'pro' || pt === 'professional') return 'Pro'
      if (pt === 'enterprise' || pt === 'max') return 'Max'
      return pkg.name
    })()
    return ({
      ...pkg,
      name: mappedName,
      price: pkg.priceCents / 100,
      daily_credits: pkg.dailyPoints,
      valid_days: pkg.validDays,
      plan_type: pkg.planType,
      is_recommended: (pkg.features?.isRecommended === true),
    })
  })

  // Sort display order: Plus -> Max -> Pro
  const tierRank = (pkg: Package): number => {
    const plan = (pkg.plan_type || pkg.planType || '').toLowerCase()
    const name = (pkg.name || '').toLowerCase()
    // Normalize to tiers
    const isPlus = plan === 'basic' || name.includes('plus')
    const isMax = plan === 'enterprise' || plan === 'max' || name.includes('max')
    const isPro = plan === 'pro' || plan === 'professional' || name.includes('pro')
    if (isPlus) return 0
    if (isMax) return 1
    if (isPro) return 2
    return 99
  }
  const sortedPackages = [...packages].sort((a, b) => tierRank(a) - tierRank(b) || (a.sortOrder - b.sortOrder))
  const currentPackage: UserPackage | null = packagesResp?.data?.currentPackage ? fromApiUserPackage(packagesResp.data.currentPackage) : null
  // keep other state lines removed above relocated earlier

  // Determine button kind and text
  const getButtonKind = (pkg: Package): 'choose' | 'renew' | 'upgrade' => {
    if (!currentPackage) return 'choose'
    if (currentPackage.packageId === pkg.id) return 'renew'
    const currentPkg = packages.find(p => p.id === currentPackage.packageId)
    if (!currentPkg) return 'choose'
    const currentPrice = currentPkg.price
    const targetPrice = pkg.price
    if (targetPrice > currentPrice) return 'upgrade'
    return 'choose'
  }
  const getButtonText = (pkg: Package): string => {
    const kind = getButtonKind(pkg)
    if (kind === 'renew') return t('packages.renew')
    if (kind === 'upgrade') return t('packages.upgrade')
    return t('packages.choosePlan')
  }

  // Determine if button should be disabled
  const isButtonDisabled = (pkg: Package): boolean => {
    return false; // No packages are disabled, all can be selected
  };


  // Remove old fetchPackages in favor of SWR above

  // Calculate upgrade discount based on remaining days (only for upgrades)
  const calculateUpgradeDiscount = (targetPackage: Package) => {
    if (!currentPackage || !targetPackage) return null;

    console.log("=== 开始计算升级优惠 ===");
    console.log("目标套餐:", targetPackage);

    const currentPkg = packages.find(p => p.id === currentPackage.packageId);
    if (!currentPkg) {
      console.log("未找到当前套餐详情 → 不适用优惠");
      return null;
    }

    const currentPrice = currentPkg.price;
    const targetPrice = targetPackage.price;
    console.log("当前套餐价格:", currentPrice, "目标套餐价格:", targetPrice);

    // 只对升级(目标价格高于当前价格)生效
    if (targetPrice <= currentPrice) {
      console.log("目标套餐价格不高于当前套餐 → 不适用优惠");
      return null;
    }

    const remainingDays = currentPackage.remainingDays || 0;
    console.log("剩余天数:", remainingDays);

    if (remainingDays <= 0) {
      console.log("剩余天数 <= 0 → 不适用优惠");
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
    console.log('=== handlePurchase clicked ===');
    console.log('Session:', session);
    console.log('Package:', pkg);

    if (!session) {
      console.log('No session, redirecting to signin');
      showWarning(t('toasts.pleaseLoginFirst'));
      router.push('/signin');
      return;
    }

    const kind = getButtonKind(pkg);
    console.log('Button kind:', kind);

    if (kind === 'renew') {
      // Handle renewal - could redirect to renewal flow or show renewal modal
      handleRenewal(pkg);
    } else if (kind === 'upgrade') {
      // Calculate discount for upgrade
      console.log('Upgrade');

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

  // Confirm renewal and process the renewal - create order and show payment method selection
  const confirmRenew = async () => {
    if (isRenewing || !renewPackage) return;

    setIsRenewing(true);

    try {
      // 创建续费订单 (续费也需要支付)
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderType: 'package',
          packageId: renewPackage.id,
          paymentMethod: 'pending', // 暂时设置为pending,等用户选择
          renewMonths: selectedMonths, // 标记为续费订单
        }),
      });

      const data = await response.json();

      if (data.success) {
        const orderNo = data.data.order.orderNo as string;

        // 保存订单号,关闭续费弹窗,打开支付方式选择modal
        setPendingOrderNo(orderNo);
        setShowRenewModal(false);
        setShowPaymentMethodModal(true);
      } else {
        showError(data.error?.message || t('toasts.failedCreateRenewalOrder'));
        setIsRenewing(false);
      }
    } catch (error) {
      showError(t('toasts.renewalFailedRetry'));
      setIsRenewing(false);
    }
  };

  // Confirm purchase - create order and show payment method selection
  const confirmPurchase = async () => {
    if (!selectedPackage || purchasing) return;

    setPurchasing(true);

    try {
      // Create order first
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderType: 'package',
          packageId: selectedPackage.id,
          paymentMethod: 'pending', // 暂时设置为pending,等用户选择
          upgradeDiscount: upgradeDiscount ? upgradeDiscount.amount : 0
        }),
      });

      const data = await response.json();

      if (data.success) {
        const orderNo = data.data.order.orderNo as string;

        // 保存订单号,关闭确认modal,打开支付方式选择modal
        setPendingOrderNo(orderNo);
        setShowConfirmModal(false);
        setShowPaymentMethodModal(true);
      } else {
        showError(data.error?.message || t('toasts.failedCreateOrder'));
        setPurchasing(false);
      }
    } catch (error) {
      showError(t('toasts.purchaseFailedRetry'));
      setPurchasing(false);
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
          throw new Error(payData?.error?.message || t('toasts.failedStripeCheckout'));
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
          throw new Error(payData?.error?.message || t('toasts.failedAntomPayment'));
        }
        window.location.href = payData.data.redirectUrl;
        return; // Redirecting
      }
    } catch (error: any) {
      showError(error.message || t('toasts.paymentFailedRetry'));
      setProcessingPayment(false);
      setShowPaymentMethodModal(false);
      setPendingOrderNo(null);
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
    // Prefer structured features from backend
    const f = (pkg.features || {}) as any;
    const creditCap = Number(f.creditCap ?? pkg.daily_credits ?? pkg.dailyPoints ?? 0);
    const recoveryRate = Number(f.recoveryRate ?? 0);
    const dailyUsageLimit = Number(f.dailyUsageLimit ?? 0);
    const manualResetPerDay = Number(f.manualResetPerDay ?? 0);
    const hoursToFull = recoveryRate > 0 && creditCap > 0 ? Math.ceil(creditCap / recoveryRate) : null;

    const common = [
      t('packages.features.creditCap', { count: creditCap.toLocaleString() }) || `${creditCap.toLocaleString()} credit cap`,
      recoveryRate > 0
        ? (t('packages.features.recoveryPerHour', { count: recoveryRate.toLocaleString() }) || `Recovery rate ${recoveryRate.toLocaleString()}/hour`)
        : (t('packages.features.recoveryZero') || 'Recovery rate 0/hour'),
      dailyUsageLimit > 0
        ? (t('packages.features.dailyMaxUsage', { count: dailyUsageLimit.toLocaleString() }) || `Daily max usage ${dailyUsageLimit.toLocaleString()} credits`)
        : (t('packages.features.noDailyCap') || 'No daily usage cap'),
      hoursToFull
        ? (t('packages.features.fullRecoveryHours', { hours: String(hoursToFull) }) || `Full recovery in ~${hoursToFull} hours`)
        : (t('packages.features.fullRecoveryNA') || 'Full recovery N/A'),
      manualResetPerDay > 0
        ? (t('packages.features.manualResetPerDay', { count: String(manualResetPerDay) }) || `Manual reset to cap ${manualResetPerDay} time(s) per day`)
        : (t('packages.features.noManualReset') || 'No manual reset'),
      t('packages.features.cliTools') || 'Supports Claude and full suite of CLI tools',
    ];

    const name = (pkg.name || '').toLowerCase();
    const isPro = name.includes('pro') || pkg.plan_type === 'pro' || pkg.planType === 'pro';
    const isMax = name.includes('max') || pkg.plan_type === 'enterprise' || pkg.planType === 'enterprise';

    if (isPro || isMax) {
      return [...common, (t('packages.features.prioritySupport') || 'Priority technical support')];
    }
    return [...common, (t('packages.features.standardSupport') || 'Standard technical support')];
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
            {t('packages.pricingTitle')}
          </h1>
          <p style={{ fontSize: '16px', color: '#999', marginBottom: '12px' }}>
            {t('packages.pricingSubtitle')}
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
              <strong>{t('packages.important')}</strong> {t('packages.pricingFollowClaude')}
            </span>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        {sortedPackages.map((pkg) => {


          return pkg.plan_type !== "credits" ? (
            <div key={pkg.id} className="col-lg-4 mb-4">
              <div className="balance-card" style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(121,74,255,0.14), rgba(20,20,20,0.9))',
                border: pkg.is_recommended ? '1px solid rgba(255,68,68,0.6)' : '1px solid rgba(121,74,255,0.25)',
                borderRadius: '14px',
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform .2s ease, box-shadow .2s ease',
                boxShadow: pkg.is_recommended ? '0 12px 36px rgba(255,68,68,0.18)' : '0 10px 30px rgba(0,0,0,0.35)'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '14px',
                  background: 'radial-gradient(900px 200px at 10% -10%, rgba(121,74,255,0.18), transparent)',
                  pointerEvents: 'none',
                  zIndex: 0
                }} />
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
                    🔥 {t('packages.mostPopular')}
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

                <div className="text-center mb-4" style={{ position: 'relative', paddingTop: pkg.is_recommended ? '6px' : '0', zIndex: 1 }}>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#fff',
                    marginBottom: 16,
                    letterSpacing: '0.5px'
                  }}>{pkg.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginBottom: 18 }}>
                    <span style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1 }}>${pkg.price}</span>
                    <span style={{ fontSize: 14, color: '#9aa0a6' }}>{t('packages.perMonth')}</span>
                </div>
                </div>

                <ul className="list-unstyled" style={{ flex: 1, marginBottom: '24px', position: 'relative', zIndex: 1 }}>
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
                    position: 'relative',
                    zIndex: 2,
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: (() => {
                      const kind = getButtonKind(pkg);
                      if (kind === 'renew') {
                        return 'linear-gradient(135deg, #00d084 0%, #00b377 100%)';
                      } else if (kind === 'upgrade') {
                        return 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)';
                      } else if (pkg.is_recommended) {
                        return 'linear-gradient(135deg, #ff4444 0%, #ff6666 100%)';
                      } else {
                        return 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)';
                      }
                    })(),
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: isButtonDisabled(pkg) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: pkg.is_recommended ? '0 8px 24px rgba(255,68,68,0.22)' : '0 6px 18px rgba(121,74,255,0.22)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isButtonDisabled(pkg)) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = pkg.is_recommended ? '0 10px 26px rgba(255,68,68,0.28)' : '0 8px 22px rgba(121,74,255,0.28)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = pkg.is_recommended ? '0 8px 24px rgba(255,68,68,0.22)' : '0 6px 18px rgba(121,74,255,0.22)';
                  }}
                >
                  {getButtonText(pkg)}
                </button>
              </div>
            </div>
          ) : null
        })}
      </div>

      {/* Redeem card below pricing grid */}
      <RedeemCodeCard mutatePackages={mutatePackages} toast={{ showSuccess, showError, showWarning }} />

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
              {getButtonKind(selectedPackage) === 'upgrade' ? t('packages.confirmUpgrade') || 'Confirm Upgrade' : t('packages.confirmPurchase') || 'Confirm Purchase'}
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
                <span style={{ color: '#999' }}>{t('packages.originalPrice') || 'Original Price'}</span>
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
                      {(t('packages.upgradeDiscountLabel', { days: String(upgradeDiscount.days) }) || `Upgrade Discount (${upgradeDiscount.days} days remaining)`)}
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
                    <span style={{ color: '#fff', fontWeight: '600' }}>{t('packages.finalPrice') || 'Final Price'}</span>
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
                <span style={{ color: '#999' }}>{t('packages.dailyCredits') || 'Daily Credits'}</span>
                <span style={{ color: '#fff' }}>{selectedPackage.daily_credits.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#999' }}>{t('packages.validity') || 'Validity'}</span>
                <span style={{ color: '#fff' }}>{t('packages.daysWithCount', { days: String(selectedPackage.valid_days) }) || `${selectedPackage.valid_days} days`}</span>
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
                  {t('packages.discountNotice', { days: String(upgradeDiscount.days) }) || `Your remaining ${upgradeDiscount.days} days from current plan has been converted to a discount`}
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
                {t('common.cancel') || 'Cancel'}
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
                {purchasing ? (t('packages.processing') || 'Processing...') : (t('common.confirm') || 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renewal Modal */}
      <ModalPortal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        title={t('packages.renewTitle') || 'Renew Your Package'}
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
            {t('packages.selectRenewalPeriod') || 'Select your renewal period'}
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
                  {months === 1 ? (t('packages.month') || 'Month') : (t('packages.months') || 'Months')}
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
                    {t('packages.popular').toUpperCase()}
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
                {t('packages.selectedDuration') || 'Selected Duration'}
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
                {selectedMonths} {selectedMonths === 1 ? (t('packages.month') || 'Month') : (t('packages.months') || 'Months')}
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
                {t('packages.newExpiryDate') || 'New Expiry Date'}
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
            {t('common.cancel') || 'Cancel'}
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
            {isRenewing ? (t('packages.processing') || 'Processing...') : (t('packages.confirmRenewal') || 'Confirm Renewal')}
          </button>
        </div>
      </ModalPortal>

      {/* Payment Method Selection Modal */}
      <PaymentMethodModal
        isOpen={showPaymentMethodModal}
        onClose={() => {
          setShowPaymentMethodModal(false);
          setPendingOrderNo(null);
          setPurchasing(false);
          setProcessingPayment(false);
          setIsRenewing(false);
        }}
        onSelectMethod={handlePaymentMethodSelect}
        processing={processingPayment}
      />
    </>
  );
}
