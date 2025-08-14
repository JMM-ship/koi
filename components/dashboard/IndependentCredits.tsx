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
      borderRadius: '0.75rem',
      padding: '1.25rem',
      display: 'block',
      transition: 'all 0.3s',
      marginTop: '1rem'
    }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
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
          textTransform: 'uppercase'
        }}>
          ACTIVE
        </span>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fff' }}>
              {creditsData.remaining.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>
              Credits Remaining
            </span>
          </div>
          <span style={{ fontSize: '0.875rem', color: '#ffa500' }}>
            {creditsData.percentage}%
          </span>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
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

      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
        <div className="d-flex justify-content-between" style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#999' }}>Last Purchase</span>
          <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '500' }}>
            {creditsData.lastPurchase}
          </span>
        </div>
        <div className="d-flex justify-content-between" style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#999' }}>Purchase Amount</span>
          <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '500' }}>
            {creditsData.purchaseAmount.toLocaleString()} Credits
          </span>
        </div>
        <div className="d-flex justify-content-between">
          <span style={{ fontSize: '0.75rem', color: '#999' }}>Expires On</span>
          <span style={{ fontSize: '0.75rem', color: '#ffa500', fontWeight: '500' }}>
            {creditsData.expiryDate}
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
          fontWeight: '500'
        }}>
          Purchase More
        </button>
        <button className="btn btn-sm flex-fill" style={{
          background: 'transparent',
          border: '1px solid #ffa500',
          borderRadius: '0.375rem',
          padding: '0.5rem 1rem',
          color: '#ffa500',
          fontSize: '0.8125rem',
          fontWeight: '500'
        }}>
          View History
        </button>
      </div>
    </div>
  );
};

export default IndependentCredits;