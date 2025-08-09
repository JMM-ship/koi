"use client";

import { useState } from "react";
import { FiCheck } from "react-icons/fi";

export default function PlansContent() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 1,
      name: "Starter",
      monthlyPrice: 9,
      yearlyPrice: 90,
      description: "Perfect for individuals and small projects",
      features: [
        { text: "1,000 API calls/month", included: true },
        { text: "Basic analytics", included: true },
        { text: "Email support", included: true },
        { text: "1 GB storage", included: true },
        { text: "Custom integrations", included: false },
        { text: "Priority support", included: false },
        { text: "Advanced analytics", included: false },
      ],
      recommended: false
    },
    {
      id: 2,
      name: "Professional",
      monthlyPrice: 29,
      yearlyPrice: 290,
      description: "Best for growing businesses and teams",
      features: [
        { text: "10,000 API calls/month", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Priority email support", included: true },
        { text: "10 GB storage", included: true },
        { text: "Custom integrations", included: true },
        { text: "API webhooks", included: true },
        { text: "Team collaboration", included: false },
      ],
      recommended: true,
      current: true
    },
    {
      id: 3,
      name: "Enterprise",
      monthlyPrice: 99,
      yearlyPrice: 990,
      description: "For large organizations with custom needs",
      features: [
        { text: "Unlimited API calls", included: true },
        { text: "Real-time analytics", included: true },
        { text: "24/7 phone & email support", included: true },
        { text: "100 GB storage", included: true },
        { text: "Custom integrations", included: true },
        { text: "API webhooks", included: true },
        { text: "Team collaboration", included: true },
        { text: "SLA guarantee", included: true },
        { text: "Custom training", included: true },
      ],
      recommended: false
    }
  ];

  return (
    <>
      <div className="dashboard-header mb-4">
        <div className="text-center">
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>Choose Your Plan</h1>
          <p style={{ fontSize: '14px', color: '#999', marginBottom: '24px' }}>Select the perfect plan for your needs. Upgrade or downgrade at any time.</p>
          
          <div style={{
            display: 'inline-flex',
            background: '#1a1a1a',
            borderRadius: '8px',
            padding: '4px'
          }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '8px 24px',
                borderRadius: '6px',
                border: 'none',
                background: billingCycle === 'monthly' ? '#794aff' : 'transparent',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              style={{
                padding: '8px 24px',
                borderRadius: '6px',
                border: 'none',
                background: billingCycle === 'yearly' ? '#794aff' : 'transparent',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s',
                position: 'relative'
              }}
            >
              Yearly
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#00d084',
                color: '#000',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: '600'
              }}>
                SAVE 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        {plans.map((plan) => (
          <div key={plan.id} className="col-lg-4 mb-4">
            <div className="balance-card" style={{
              background: '#0a0a0a',
              border: plan.current ? '2px solid #794aff' : '1px solid #1a1a1a',
              borderRadius: '12px',
              padding: '24px',
              position: 'relative',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {plan.recommended && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                  color: '#fff',
                  padding: '4px 16px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  Recommended
                </div>
              )}
              
              {plan.current && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: '#00d084',
                  color: '#000',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  Current
                </div>
              )}

              <div className="text-center mb-4">
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>{plan.name}</h3>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>{plan.description}</p>
                
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '36px', fontWeight: '700', color: '#fff' }}>
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
              </div>

              <ul className="list-unstyled" style={{ flex: 1, marginBottom: '20px' }}>
                {plan.features.map((feature, index) => (
                  <li key={index} className="d-flex align-items-center" style={{ marginBottom: '12px' }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: feature.included ? 'rgba(0, 208, 132, 0.2)' : 'rgba(75, 85, 99, 0.2)',
                      marginRight: '10px',
                      flexShrink: 0
                    }}>
                      <FiCheck style={{
                        fontSize: '12px',
                        color: feature.included ? '#00d084' : '#4b5563'
                      }} />
                    </span>
                    <span style={{
                      fontSize: '13px',
                      color: feature.included ? '#fff' : '#666',
                      textDecoration: feature.included ? 'none' : 'line-through'
                    }}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: plan.current ? '1px solid #794aff' : 'none',
                background: plan.current ? 'transparent' : 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                color: plan.current ? '#794aff' : '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}>
                {plan.current ? 'Current Plan' : 'Upgrade Now'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-4">
        <p style={{ fontSize: '13px', color: '#666' }}>
          All plans include SSL certificate, 99.9% uptime guarantee, and basic customer support.
        </p>
        <p style={{ fontSize: '13px', color: '#666' }}>
          Need a custom plan? <a href="#" style={{ color: '#794aff', textDecoration: 'none' }}>Contact our sales team</a>
        </p>
      </div>
    </>
  );
}