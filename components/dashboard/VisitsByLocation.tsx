"use client";

const CurrentPlan = () => {
  const planDetails = {
    name: "Professional",
    price: "$29",
    billing: "month",
    status: "active", // active, expiring_soon, expired
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
  };

  return (
    <div className="balance-card" style={{
      background: '#0a0a0a',
      border: '1px solid #1a1a1a',
      borderRadius: '12px',
      padding: '20px',
      display: 'block',
      transition: 'all 0.3s',
      height: 'auto'
    }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 }}>Current Plan</h3>
        <span style={{
          padding: '4px 10px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600',
          color: '#000',
          background: planDetails.statusColor,
          textTransform: 'uppercase'
        }}>
          {planDetails.statusLabel}
        </span>
      </div>

      <div className="mb-3 p-3" style={{
        background: 'rgba(121, 74, 255, 0.1)',
        border: '1px solid rgba(121, 74, 255, 0.2)',
        borderRadius: '8px'
      }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', margin: 0 }}>{planDetails.name}</h4>
          <div className="text-end">
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>{planDetails.price}</span>
            <span style={{ color: '#999', fontSize: '13px' }}>/{planDetails.billing}</span>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <button className="btn btn-sm" style={{
            background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 12px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            Upgrade
          </button>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '12px', marginBottom: '12px' }}>
        <h5 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: '600', marginBottom: '10px' }}>Subscription Period</h5>
        <div className="d-flex justify-content-between" style={{ marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: '#999' }}>Start Date</span>
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>{planDetails.startDate}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span style={{ fontSize: '12px', color: '#999' }}>End Date</span>
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>{planDetails.endDate}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '12px', marginBottom: '12px' }}>
        <h5 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: '600', marginBottom: '10px' }}>Features</h5>
        <ul className="list-unstyled" style={{ margin: 0 }}>
          {planDetails.features.map((feature, index) => (
            <li key={index} className="d-flex align-items-center" style={{ marginBottom: '8px' }}>
              <span style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: feature.included ? '#00d084' : '#4b5563',
                marginRight: '8px',
                fontSize: '10px',
                color: feature.included ? '#000' : '#999',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {feature.included ? '✓' : '×'}
              </span>
              <span style={{
                fontSize: '13px',
                color: feature.included ? '#fff' : '#666',
                textDecoration: feature.included ? 'none' : 'line-through'
              }}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '12px', marginBottom: '12px' }}>
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