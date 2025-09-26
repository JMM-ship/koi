"use client";

import { useState, useEffect } from "react";
import IndependentPackages from "./IndependentPackages";
import { useDashboard, useCreditBalance, useUserPackage } from "@/contexts/DashboardContext";

const IndependentCredits = () => {
  const [creditsData, setCreditsData] = useState({
    total: 0,
    used: 0,
    remaining: 0,
    percentage: 0,
    expiryDate: "March 31, 2025",
    lastPurchase: "December 10, 2024",
    purchaseAmount: 0
  });
  const [showPackages, setShowPackages] = useState(false);
  
  // Get data from context
  const { data, isLoading, refreshData, forceRefreshAfterPurchase } = useDashboard();
  const creditBalance = useCreditBalance();
  const userPackage = useUserPackage();
  useEffect(() => {
    if (data && creditBalance) {
      const processCreditsData = () => {
        try {
          // 获取独立积分数据
          const balance = creditBalance;
          const independent = balance?.independentCredits || 0;
          const totalPurchased = balance?.totalPurchased || 50000;
          const used = Math.min(balance?.totalUsed || 0, totalPurchased - independent);
          const percentage = totalPurchased > 0 ? (independent / totalPurchased) * 100 : 0;

          // 获取最后购买信息
          const lastOrder = userPackage;
        const lastPurchaseDate = lastOrder?.createdAt
          ? new Date(lastOrder.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })
          : "December 10, 2024";

        setCreditsData({
          total: totalPurchased,
          used: used,
          remaining: independent,
          percentage: percentage,
          expiryDate: lastOrder?.endDate
            ? new Date(lastOrder.endDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })
            : "March 31, 2025",
          lastPurchase: lastPurchaseDate,
          purchaseAmount: 10000
        });
      } catch (error) {
        console.error('Error processing credits data:', error);
        // 使用默认值
      }
    };

    processCreditsData();
    }
  }, [data, creditBalance, userPackage]);

  if (isLoading) {
    return (
      <div className="balance-card" style={{
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <span style={{ color: '#999' }}>Loading...</span>
      </div>
    );
  }

  // Show packages view when button is clicked
  if (showPackages) {
    return <IndependentPackages onBack={() => setShowPackages(false)} onPurchase={async () => {
      setShowPackages(false);
      // Force refresh immediately using the new method
      await forceRefreshAfterPurchase();
      // Add a backup refresh after delay
      setTimeout(() => forceRefreshAfterPurchase(), 2500);
    }} />;
  }

  return (
    <div className="balance-card" style={{
      background: '#0a0a0a',
      border: '1px solid #1a1a1a',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s',
      height: '100%'
    }}>
      <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#fff', margin: 0 }}>
          Independent Credits
        </h3>
        <span style={{
          padding: '0.25rem 0.625rem',
          borderRadius: '0.25rem',
          fontSize: '0.6875rem',
          fontWeight: '600',
          color: '#000',
          background: '#ffa500',
          textTransform: 'uppercase',
          marginLeft: "0.5rem"
        }}>
          ACTIVE
        </span>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fff' }}>
              {creditsData.remaining.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>
              Credits Remaining
            </span>
          </div>
          <span style={{ fontSize: '0.875rem', color: '#ffa500', marginLeft: "0.5rem" }}>
            {creditsData.percentage}%
          </span>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {creditsData.used.toLocaleString()} used
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {creditsData.total.toLocaleString()} total
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '0.5rem',
            backgroundColor: '#1e1f26',
            borderRadius: '0.25rem',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${creditsData.percentage}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ffa500, #ffb727)',
              borderRadius: '0.25rem',
              transition: 'width 0.5s ease-in-out'
            }} />
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="d-flex justify-content-between" style={{ marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#999' }}>Last Purchase</span>
          <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '500', marginLeft: "0.5rem" }}>
            {creditsData.lastPurchase}
          </span>
        </div>
        <div className="d-flex justify-content-between" style={{ marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#999' }}>Purchase Amount</span>
          <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '500' }}>
            {creditsData.purchaseAmount.toLocaleString()} Credits
          </span>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-sm flex-fill" style={{
          background: 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)',
          border: 'none',
          borderRadius: '0.375rem',
          padding: '0.5rem 1rem',
          color: '#fff',
          fontSize: '0.8125rem',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
          onClick={() => setShowPackages(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Purchase More
        </button>
      </div>
    </div>
  );
};

export default IndependentCredits;