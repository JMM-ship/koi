"use client";

const IndependentCredits = () => {
  const creditsData = {
    total: 50000,
    used: 12847,
    remaining: 37153,
    percentage: 74.3,
    expiryDate: "March 31, 2025",
    lastPurchase: "December 10, 2024",
    purchaseAmount: 10000
  };

  return (
    <div className="balance-card" style={{
      background: '#0a0a0a',
      border: '1px solid #1a1a1a',
      borderRadius: '12px',
      padding: '20px',
      display: 'block',
      transition: 'all 0.3s',
      marginTop: '16px'
    }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 }}>
          Independent Credits
        </h3>
        <span style={{
          padding: '4px 10px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600',
          color: '#000',
          background: '#ffa500',
          textTransform: 'uppercase'
        }}>
          ACTIVE
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>
              {creditsData.remaining.toLocaleString()}
            </span>
            <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '8px' }}>
              Credits Remaining
            </span>
          </div>
          <span style={{ fontSize: '14px', color: '#ffa500' }}>
            {creditsData.percentage}%
          </span>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {creditsData.used.toLocaleString()} used
            </span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {creditsData.total.toLocaleString()} total
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#1e1f26',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${creditsData.percentage}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ffa500, #ffb727)',
              borderRadius: '4px',
              transition: 'width 0.5s ease-in-out'
            }} />
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '12px', marginBottom: '12px' }}>
        <div className="d-flex justify-content-between" style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#999' }}>Last Purchase</span>
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>
            {creditsData.lastPurchase}
          </span>
        </div>
        <div className="d-flex justify-content-between" style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#999' }}>Purchase Amount</span>
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>
            {creditsData.purchaseAmount.toLocaleString()} Credits
          </span>
        </div>
        <div className="d-flex justify-content-between">
          <span style={{ fontSize: '12px', color: '#999' }}>Expires On</span>
          <span style={{ fontSize: '12px', color: '#ffa500', fontWeight: '500' }}>
            {creditsData.expiryDate}
          </span>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-sm flex-fill" style={{
          background: 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 16px',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Purchase More
        </button>
        <button className="btn btn-sm flex-fill" style={{
          background: 'transparent',
          border: '1px solid #ffa500',
          borderRadius: '6px',
          padding: '8px 16px',
          color: '#ffa500',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          View History
        </button>
      </div>
    </div>
  );
};

export default IndependentCredits;