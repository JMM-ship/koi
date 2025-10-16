"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useDashboard, useUserInfo, useUserPackage } from "@/contexts/DashboardContext";
import { useT } from "@/contexts/I18nContext";

interface CurrentPlanProps {
  onUpgradeClick?: () => void;
}

const CurrentPlan = ({ onUpgradeClick }: CurrentPlanProps) => {
  let _t = (k: string) => k
  try { _t = useT().t } catch {}
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [dailyCredit, setDailyCredit] = useState(0)
  const [packageCredits, setPackageCredits] = useState(0)
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  // Get data from context
  const { data, isLoading, error } = useDashboard();
  const userInfo = useUserInfo();
  const userPackage = useUserPackage();

  useEffect(() => {
    if (data && userInfo) {
      const processPlanDetails = () => {
        try {
          setDailyCredit(data?.creditBalance?.packageCredits || 0)
          setPackageCredits(userPackage?.dailyCredits || 0)


          // 格式化套餐信息 - 使用真实的数据库数据
          const now = new Date();
          const endDate = userPackage?.endDate || userInfo?.planExpiredAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          const startDate = userPackage?.startDate || new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

          // 从数据库获取真实的套餐名称和价格
          const packageName = userPackage?.packageName || 'Free';

          // 从 Package 表获取的价格
          const packagePrice = userPackage?.price ? `$${userPackage.price}` : '$0';

          // 从 Package 表的 features 获取功能列表
          const packageFeatures = userPackage?.features || {};
          const creditCap = Number(packageFeatures.creditCap ?? userPackage?.dailyCredits ?? 0);
          const recoveryRate = Number(packageFeatures.recoveryRate ?? 0);
          const dailyUsageLimit = Number(packageFeatures.dailyUsageLimit ?? 0);
          const manualResetPerDay = Number(packageFeatures.manualResetPerDay ?? 0);

          // 构建功能列表
          const featuresList = [];
          if (creditCap > 0) {
            featuresList.push({ name: (useT().t('packages.features.creditCap', { count: creditCap.toLocaleString() }) || `Credit Cap: ${creditCap.toLocaleString()}`), included: true });
          }
          if (recoveryRate > 0) {
            featuresList.push({ name: (useT().t('packages.features.recoveryPerHour', { count: recoveryRate.toLocaleString() }) || `Recovery Rate: ${recoveryRate.toLocaleString()}/hour`), included: true });
          }
          if (dailyUsageLimit > 0) {
            featuresList.push({ name: (useT().t('packages.features.dailyMaxUsage', { count: dailyUsageLimit.toLocaleString() }) || `Daily Usage Limit: ${dailyUsageLimit.toLocaleString()}`), included: true });
          }
          if (manualResetPerDay > 0) {
            featuresList.push({ name: (useT().t('packages.features.manualResetPerDay', { count: String(manualResetPerDay) }) || `Manual Resets: ${manualResetPerDay}/day`), included: true });
          }

          // 如果没有从数据库获取到功能,使用基本功能
          if (featuresList.length === 0 && packageName !== 'Free') {
            featuresList.push({ name: "API Access", included: true });
            featuresList.push({ name: "Credit System", included: true });
          }

          const isActive = new Date(endDate) > now;
          const daysRemaining = Math.floor((new Date(endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const status = isActive ? (daysRemaining < 7 ? 'expiring_soon' : 'active') : 'expired';

          setPlanDetails({
            name: packageName,
            price: packagePrice,
            billing: 'month',
            status,
            statusLabel: status === 'active' ? 'Active' : status === 'expiring_soon' ? 'Expiring Soon' : 'Expired',
            statusColor: status === 'active' ? '#00d084' : status === 'expiring_soon' ? '#ffa500' : '#ff006e',
            startDate: new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            endDate: new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            features: featuresList,
            usage: {
              apiCalls: { used: 8500, limit: "Unlimited" },
              storage: { used: 3.2, limit: 10, unit: "GB" },
              users: { used: 3, limit: 5 },
            },
            nextBilling: new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          });
        } catch (error) {
          console.error('Error fetching plan details:', error);
          // 使用默认值
          setPlanDetails({
            name: "Free",
            price: "$0",
            billing: "month",
            status: "active",
            statusLabel: "Active",
            statusColor: "#00d084",
            startDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            features: [
              { name: "Basic API Access", included: true },
            ],
            usage: {
              apiCalls: { used: 0, limit: "Limited" },
              storage: { used: 0, limit: 1, unit: "GB" },
              users: { used: 1, limit: 1 },
            },
            nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          });
        } finally {
          // Data loading is handled by context
        }
      };

      processPlanDetails();
    }
  }, [data, userInfo, userPackage]);

  const handleRenew = () => {
    // Navigate to pricing plans page
    router.push('/dashboard?tab=plans');
  };

  if (isLoading || !planDetails) {
    return (
      <div className="balance-card" style={{
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        height: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px'
      }}>
        <span style={{ color: '#999' }}>{'Loading...'}</span>
      </div>
    );
  }

  return (
    <div className="balance-card" style={{
      background: '#0a0a0a',
      border: '1px solid #1a1a1a',
      borderRadius: '0.75rem',
      padding: '1.25rem',
      display: 'block',
      transition: 'all 0.3s',
      height: 'auto'
    }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#fff', margin: 0 }}>{_t('dashboard.planCard.currentPlan') || 'Current Plan'}</h3>
        <span style={{
          padding: '0.25rem 0.625rem',
          borderRadius: '0.25rem',
          fontSize: '0.6875rem',
          fontWeight: '600',
          color: '#000',
          background: planDetails.statusColor,
          textTransform: 'uppercase'
        }}>
          {planDetails.statusLabel}
        </span>
      </div>

      {/* Daily Credits Display */}
      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
        <h5 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#666', fontWeight: '600', marginBottom: '0.625rem' }}>{_t('dashboard.planCard.credit') || 'Credit'}</h5>
        <div className="d-flex justify-content-between" style={{ marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#999' }}>{_t('dashboard.planCard.dailyCredit') || 'Daily Credit'}</span>
          <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '500' }}>{dailyCredit} / {packageCredits}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
        <h5 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#666', fontWeight: '600', marginBottom: '0.625rem' }}>{_t('dashboard.planCard.subscriptionPeriod') || 'Subscription Period'}</h5>
        <div className="d-flex justify-content-between" style={{ marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#999' }}>{_t('dashboard.planCard.startDate') || 'Start Date'}</span>
          <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '500' }}>{planDetails.startDate}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span style={{ fontSize: '0.75rem', color: '#999' }}>{_t('dashboard.planCard.endDate') || 'End Date'}</span>
          <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '500' }}>{planDetails.endDate}</span>
        </div>
      </div>

      <div className="mb-3" style={{
        padding: '0.75rem',
        background: 'rgba(121, 74, 255, 0.1)',
        border: '1px solid rgba(121, 74, 255, 0.2)',
        borderRadius: '0.5rem'
      }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h4 style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#fff', margin: 0 }}>{planDetails.name}</h4>
          <div className="text-end">
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>{planDetails.price}</span>
            <span style={{ color: '#999', fontSize: '0.8125rem' }}>{'/' + (_t('dashboard.planCard.month') || 'month')}</span>
          </div>
        </div>
        <div className="d-flex align-items-center">
          <button
            onClick={onUpgradeClick}
            className="btn btn-sm"
            style={{
              background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.25rem 0.75rem',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: '500',
              marginRight: '0.125rem',
              cursor: 'pointer'
            }}>
            {_t('dashboard.planCard.upgrade') || 'Upgrade'}
          </button>
          <button
            onClick={onUpgradeClick}
            className="btn btn-sm"
            style={{
              background: 'linear-gradient(135deg, #00d084 0%, #00b377 100%)',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.25rem 0.75rem',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
            {_t('dashboard.planCard.renew') || 'Renew'}
          </button>
        </div>
      </div>



      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
        <h5 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#666', fontWeight: '600', marginBottom: '0.625rem' }}>{_t('dashboard.planCard.features') || 'Features'}</h5>
        <ul className="list-unstyled" style={{ margin: 0 }}>
          {planDetails.features.map((feature: any, index: any) => (
            <li key={index} className="d-flex align-items-center" style={{ marginBottom: '0.5rem' }}>
              <span style={{
                width: '1.125rem',
                height: '1.125rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: feature.included ? '#00d084' : '#4b5563',
                marginRight: '0.5rem',
                fontSize: '0.625rem',
                color: feature.included ? '#000' : '#999',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {feature.included ? '✓' : '×'}
              </span>
              <span style={{
                fontSize: '0.8125rem',
                color: feature.included ? '#fff' : '#666',
                textDecoration: feature.included ? 'none' : 'line-through'
              }}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* <div style={{ borderTop: '1px solidrgb(146, 127, 127)', paddingTop: '12px', marginBottom: '12px' }}>
        <h5 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: '600', marginBottom: '10px' }}>Usage</h5>
        <div style={{ marginBottom: '8px' }}>
          <div className="d-flex justify-content-between" style={{ marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#999' }}>API Calls</span>
            <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>
              {planDetails.usage.apiCalls.used.toLocaleString()} / {planDetails.usage.apiCalls.limit}
            </span>
          </div>
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <div className="d-flex justify-content-between" style={{ marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#999' }}>Storage</span>
            <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>
              {planDetails.usage.storage.used}{planDetails.usage.storage.unit} / {planDetails.usage.storage.limit}{planDetails.usage.storage.unit}
            </span>
          </div>
          <div className="progress" style={{ 
            height: '6px',
            backgroundColor: '#1e1f26',
            borderRadius: '3px'
          }}>
            <div 
              className="progress-bar"
              role="progressbar"
              style={{ 
                width: `${(planDetails.usage.storage.used / planDetails.usage.storage.limit) * 100}%`,
                background: '#794aff',
                borderRadius: '3px'
              }}
              aria-valuenow={planDetails.usage.storage.used}
              aria-valuemin={0}
              aria-valuemax={planDetails.usage.storage.limit}
            ></div>
          </div>
        </div>

        <div className="d-flex justify-content-between">
          <span style={{ fontSize: '12px', color: '#999' }}>Team Members</span>
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>
            {planDetails.usage.users.used} / {planDetails.usage.users.limit}
          </span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '12px' }} className="d-flex justify-content-between align-items-center">
        <span style={{ fontSize: '11px', color: '#666' }}>Next billing: {planDetails.nextBilling}</span>
        <button className="btn btn-link p-0" style={{ 
          fontSize: '12px',
          color: '#794aff',
          textDecoration: 'none'
        }}>
          Manage Billing
        </button>
      </div> */}
    </div>
  );
};

export default CurrentPlan;
