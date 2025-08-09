"use client";

const CurrentPlan = () => {
  const planDetails = {
    name: "Professional",
    price: "$29",
    billing: "month",
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
    <div className="card shadow-lg border-0" style={{ borderRadius: '15px' }}>
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="h4 fw-bold mb-0">Current Plan</h3>
          <button className="btn btn-primary btn-sm" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 20px'
          }}>
            Upgrade
          </button>
        </div>

        <div className="mb-4 p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="h5 fw-semibold mb-0">{planDetails.name}</h4>
            <div className="text-end">
              <span className="h3 fw-bold text-dark">{planDetails.price}</span>
              <span className="text-muted small">/{planDetails.billing}</span>
            </div>
          </div>
        </div>

        <div className="border-top pt-3 mb-3">
          <h5 className="small text-uppercase text-muted fw-semibold mb-3">Features</h5>
          <ul className="list-unstyled">
            {planDetails.features.map((feature, index) => (
              <li key={index} className="d-flex align-items-center mb-2">
                <span className={`badge rounded-circle me-2 ${
                  feature.included 
                    ? 'bg-success' 
                    : 'bg-secondary'
                }`} style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {feature.included ? '✓' : '×'}
                </span>
                <span className={`small ${
                  feature.included ? '' : 'text-muted text-decoration-line-through'
                }`}>
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-top pt-3 mb-3">
          <h5 className="small text-uppercase text-muted fw-semibold mb-3">Usage</h5>
          <div className="mb-2">
            <div className="d-flex justify-content-between mb-1">
              <span className="small text-muted">API Calls</span>
              <span className="small fw-medium">
                {planDetails.usage.apiCalls.used.toLocaleString()} / {planDetails.usage.apiCalls.limit}
              </span>
            </div>
          </div>
          
          <div className="mb-2">
            <div className="d-flex justify-content-between mb-1">
              <span className="small text-muted">Storage</span>
              <span className="small fw-medium">
                {planDetails.usage.storage.used}{planDetails.usage.storage.unit} / {planDetails.usage.storage.limit}{planDetails.usage.storage.unit}
              </span>
            </div>
            <div className="progress" style={{ height: '8px' }}>
              <div 
                className="progress-bar"
                role="progressbar"
                style={{ 
                  width: `${(planDetails.usage.storage.used / planDetails.usage.storage.limit) * 100}%`,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
                aria-valuenow={planDetails.usage.storage.used}
                aria-valuemin={0}
                aria-valuemax={planDetails.usage.storage.limit}
              ></div>
            </div>
          </div>

          <div className="d-flex justify-content-between">
            <span className="small text-muted">Team Members</span>
            <span className="small fw-medium">
              {planDetails.usage.users.used} / {planDetails.usage.users.limit}
            </span>
          </div>
        </div>

        <div className="border-top pt-3 d-flex justify-content-between align-items-center">
          <span className="text-muted" style={{ fontSize: '12px' }}>Next billing: {planDetails.nextBilling}</span>
          <button className="btn btn-link btn-sm text-primary p-0 text-decoration-none">
            Manage Billing
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurrentPlan;