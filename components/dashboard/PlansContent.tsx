"use client";

import { useState } from "react";
import { FiCheck, FiAlertTriangle } from "react-icons/fi";

export default function PlansContent() {
  const plans = [
    {
      id: 1,
      name: "Monthly",
      monthlyPrice: 399,
      description: "",
      features: [
        { text: "5 people share one $200 Max account", included: true },
        { text: "Total 10,800 points/day - suitable for daily development", included: true },
        { text: "4 points deducted per morning", included: true },
        { text: "Support Claude 4 Opus & Sonnet", included: true },
        { text: "1v1 engineer service", included: true },
      ],
      recommended: false,
      buttonText: "Choose Standard Plan"
    },
    {
      id: 2,
      name: "Large Monthly",
      monthlyPrice: 699,
      originalPrice: 100,
      description: "",
      discount: "Much more than double",
      features: [
        { text: "3 people share one $200 account", included: true },
        { text: "Total 19,000 points/day - high intensity development", included: true },
        { text: "4 points deducted per morning", included: true },
        { text: "Support Claude 4 Opus & Sonnet", included: true },
        { text: "1v1 engineer service", included: true },
        { text: "Priority technical support", included: true },
        { text: "$100 quota worth more than double, only ¥699", included: true, highlight: true },
      ],
      recommended: true,
      isPopular: true,
      buttonText: "Choose Advanced Plan"
    },
    {
      id: 3,
      name: "Exclusive",
      monthlyPrice: 1799,
      description: "",
      hasPromo: true,
      promoText: "¥200 Experience Voucher",
      features: [
        { text: "Exclusive $200 experience", included: true },
        { text: "Exclusive account, ultra experience", included: true },
        { text: "Total 71,500 points/day - high intensity professional development", included: true },
        { text: "4 points deducted per morning", included: true },
        { text: "Support Claude 4 Opus & Sonnet", included: true },
        { text: "Dedicated WeChat consulting service", included: true },
        { text: "1v1 engineer service", included: true },
        { text: "Priority technical support", included: true },
      ],
      recommended: false,
      buttonText: "Choose Custom Plan"
    }
  ];

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
        {plans.map((plan) => (
          <div key={plan.id} className="col-lg-4 mb-4">
            <div className="balance-card" style={{
              background: '#0a0a0a',
              border: plan.recommended ? '2px solid #ff4444' : '1px solid #1a1a1a',
              borderRadius: '12px',
              padding: '24px',
              position: 'relative',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.3s',
              ...(plan.recommended && {
                transform: 'scale(1.05)',
                boxShadow: '0 8px 24px rgba(255, 68, 68, 0.2)'
              })
            }}>
              {plan.recommended && (
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
                  🔥 Compare $100 quota worth more than double
                </div>
              )}

              {plan.hasPromo && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {plan.promoText}
                </div>
              )}

              <div className="text-center mb-4" style={{ paddingTop: plan.recommended ? '20px' : '0' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#999',
                  marginBottom: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {plan.name}
                </h3>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '52px', fontWeight: '700', color: '#fff', lineHeight: 1 }}>
                      ¥{plan.monthlyPrice}
                    </span>
                    <span style={{ fontSize: '16px', color: '#666' }}>
                      /month
                    </span>
                  </div>
                  {plan.originalPrice && (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#666', textDecoration: 'line-through' }}>
                        Original ¥{plan.originalPrice}/month
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: '#ff4444',
                        marginLeft: '8px',
                        fontWeight: '600',
                        background: 'rgba(255, 68, 68, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {plan.discount}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <ul className="list-unstyled" style={{ flex: 1, marginBottom: '24px' }}>
                {plan.features.map((feature, index) => (
                  <li key={index} className="d-flex align-items-start" style={{ marginBottom: '14px' }}>
                    <span style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: feature.included ? 'rgba(0, 208, 132, 0.15)' : 'rgba(75, 85, 99, 0.2)',
                      marginRight: '10px',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <FiCheck style={{
                        fontSize: '11px',
                        color: feature.included ? '#00d084' : '#4b5563',
                        fontWeight: 'bold'
                      }} />
                    </span>
                    <span style={{
                      fontSize: '13px',
                      color: (feature as any).highlight ? '#ffc107' : (feature.included ? '#e0e0e0' : '#666'),
                      lineHeight: '1.5',
                      fontWeight: (feature as any).highlight ? '500' : '400'
                    }}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                background: plan.recommended
                  ? 'linear-gradient(135deg, #ff4444 0%, #ff6666 100%)'
                  : 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(121, 74, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {plan.buttonText}
              </button>
            </div>
          </div>
        ))}
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
    </>
  );
}