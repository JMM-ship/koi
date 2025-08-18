"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import ModalPortal from "@/components/common/ModalPortal";

interface CurrentPlanProps {
  onUpgradeClick?: () => void;
}

const CurrentPlan = ({ onUpgradeClick }: CurrentPlanProps) => {
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [isRenewing, setIsRenewing] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const result = await response.json();

        const userInfo = result.userInfo;
        const userPackage = result.userPackage;

        // 格式化套餐信息
        const now = new Date();
        const endDate = userPackage?.endDate || userInfo?.planExpiredAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const startDate = userPackage?.startDate || new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

        const planType = userInfo?.planType || 'free';
        const planNames: any = {
          'free': 'Free',
          'basic': 'Basic',
          'pro': 'Professional',
          'enterprise': 'Enterprise'
        };

        const planPrices: any = {
          'free': '$0',
          'basic': '$9',
          'pro': '$29',
          'enterprise': '$99'
        };

        const isActive = new Date(endDate) > now;
        const daysRemaining = Math.floor((new Date(endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const status = isActive ? (daysRemaining < 7 ? 'expiring_soon' : 'active') : 'expired';

        setPlanDetails({
          name: planNames[planType],
          price: planPrices[planType],
          billing: 'month',
          status,
          statusLabel: status === 'active' ? 'Active' : status === 'expiring_soon' ? 'Expiring Soon' : 'Expired',
          statusColor: status === 'active' ? '#00d084' : status === 'expiring_soon' ? '#ffa500' : '#ff006e',
          startDate: new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          endDate: new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          features: [
            { name: "Unlimited API Calls", included: planType !== 'free' },
            { name: "Advanced Analytics", included: planType === 'pro' || planType === 'enterprise' },
            { name: "Priority Support", included: planType === 'pro' || planType === 'enterprise' },
            { name: "Custom Integrations", included: planType === 'enterprise' },
            { name: "Team Collaboration", included: planType === 'enterprise' },
          ],
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
          name: "Professional",
          price: "$29",
          billing: "month",
          status: "active",
          statusLabel: "Active",
          statusColor: "#00d084",
          startDate: "December 15, 2024",
          endDate: "January 15, 2025",
          features: [
            { name: "Unlimited API Calls", included: true },
            { name: "Advanced Analytics", included: true },
            { name: "Priority Support", included: true },
            { name: "Custom Integrations", included: true },
            { name: "Team Collaboration", included: false },
          ],
          usage: {
            apiCalls: { used: 8500, limit: "Unlimited" },
            storage: { used: 3.2, limit: 10, unit: "GB" },
            users: { used: 3, limit: 5 },
          },
          nextBilling: "January 15, 2025",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlanDetails();
  }, []);

  const handleRenew = () => {
    setShowRenewModal(true);
  };

  const confirmRenew = async () => {
    if (isRenewing) return;
    
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
        // Refresh plan details
        window.location.reload();
      } else {
        showError(data.error?.message || 'Failed to renew package');
      }
    } catch (error) {
      showError('Renewal failed, please try again');
    } finally {
      setIsRenewing(false);
    }
  };

  if (loading || !planDetails) {
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
        <span style={{ color: '#999' }}>Loading...</span>
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
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#fff', margin: 0 }}>Current Plan</h3>
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

      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
        <h5 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#666', fontWeight: '600', marginBottom: '0.625rem' }}>Subscription Period</h5>
        <div className="d-flex justify-content-between" style={{ marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#999' }}>Start Date</span>
          <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '500' }}>{planDetails.startDate}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span style={{ fontSize: '0.75rem', color: '#999' }}>End Date</span>
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
            <span style={{ color: '#999', fontSize: '0.8125rem' }}>/{planDetails.billing}</span>
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
            Upgrade
          </button>
          <button 
            onClick={handleRenew}
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
            Renew
          </button>
        </div>
      </div>



      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
        <h5 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#666', fontWeight: '600', marginBottom: '0.625rem' }}>Features</h5>
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
                  const currentEnd = new Date(planDetails?.endDate || new Date());
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
    </div>
  );
};

export default CurrentPlan;