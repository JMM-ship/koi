"use client";

import { useState, useEffect } from "react";
import { FiCreditCard, FiGift, FiTrendingUp, FiTag, FiCalendar, FiRefreshCw, FiCheck, FiClock } from "react-icons/fi";

export default function SubscriptionContent() {
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    backgroundColor: 'transparent'
  };

  const thStyle = {
    color: '#666',
    fontSize: '12px',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    padding: '12px 8px',
    borderBottom: '1px solid #1a1a1a',
    textAlign: 'left' as const,
    background: 'transparent'
  };

  const tdStyle = {
    fontSize: '13px',
    padding: '12px 8px',
    borderBottom: '1px solid #1a1a1a',
    color: '#e0e0e0',
    background: 'transparent'
  };

  const handleRedeem = () => {
    setIsRedeeming(true);
    setTimeout(() => {
      setIsRedeeming(false);
      setRedeemCode("");
    }, 2000);
  };

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      <div className="mb-4">
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>Subscription Management</h1>
        <p style={{ fontSize: '14px', color: '#999' }}>Manage your subscription, credits, and rewards</p>
      </div>

      {/* 2x2 Grid Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: windowWidth >= 1200 ? 'repeat(2, 1fr)' : '1fr',
        gap: '20px',
        marginBottom: '20px'
      }}>
        
        {/* Current Subscription Card */}
        <div className="balance-card" style={{ 
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 100%)',
          border: '1px solid #2a1a2a',
          borderRadius: '12px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ 
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(121, 74, 255, 0.1) 0%, transparent 70%)',
            borderRadius: '50%'
          }}></div>
          
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: 'rgba(121, 74, 255, 0.15)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiCreditCard size={20} color="#794aff" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 }}>Current Subscription</h3>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#999', fontSize: '13px' }}>Plan</span>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Professional</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#999', fontSize: '13px' }}>Status</span>
                <span style={{ 
                  padding: '4px 10px', 
                  borderRadius: '4px', 
                  fontSize: '11px', 
                  background: 'rgba(0, 208, 132, 0.15)',
                  color: '#00d084',
                  fontWeight: '600'
                }}>Active</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#999', fontSize: '13px' }}>Expires</span>
                <span style={{ color: '#e0e0e0', fontSize: '13px' }}>Feb 15, 2025</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#999', fontSize: '13px' }}>Credits Remaining</span>
                <span style={{ color: '#794aff', fontSize: '14px', fontWeight: '600' }}>8,500</span>
              </div>
            </div>

            <button style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(121, 74, 255, 0.1)',
              border: '1px solid #794aff',
              borderRadius: '8px',
              color: '#794aff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#794aff';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(121, 74, 255, 0.1)';
              e.currentTarget.style.color = '#794aff';
            }}>
              <FiRefreshCw size={16} />
              Renew Subscription
            </button>
          </div>
        </div>

        {/* Redeem Code Card */}
        <div className="balance-card" style={{ 
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'rgba(255, 193, 7, 0.15)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiGift size={20} color="#ffc107" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 }}>Redeem Code</h3>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Enter your redemption code"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0a0a0a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                marginBottom: '12px'
              }}
            />
            <button 
              onClick={handleRedeem}
              disabled={!redeemCode || isRedeeming}
              style={{
                width: '100%',
                padding: '10px',
                background: redeemCode && !isRedeeming ? '#ffc107' : '#333',
                border: 'none',
                borderRadius: '8px',
                color: redeemCode && !isRedeeming ? '#000' : '#666',
                fontSize: '14px',
                fontWeight: '600',
                cursor: redeemCode && !isRedeeming ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s'
              }}>
              {isRedeeming ? 'Redeeming...' : 'Redeem Code'}
            </button>
          </div>

          <div>
            <p style={{ color: '#999', fontSize: '12px', marginBottom: '12px' }}>Recent Redemptions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#e0e0e0', fontSize: '13px' }}>WINTER2025</span>
                <span style={{ color: '#00d084', fontSize: '12px' }}>+500 Credits</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#e0e0e0', fontSize: '13px' }}>NEWYEAR50</span>
                <span style={{ color: '#00d084', fontSize: '12px' }}>50% Discount</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#e0e0e0', fontSize: '13px' }}>BONUS100</span>
                <span style={{ color: '#00d084', fontSize: '12px' }}>+100 Credits</span>
              </div>
            </div>
          </div>
        </div>

        {/* Credits History Card */}
        <div className="balance-card" style={{ 
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'rgba(0, 208, 132, 0.15)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiTrendingUp size={20} color="#00d084" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 }}>Credits History</h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Type</th>
                  <th style={{...thStyle, textAlign: 'right'}}>Amount</th>
                  <th style={{...thStyle, textAlign: 'right'}}>Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>Jan 10, 2025</td>
                  <td style={tdStyle}>Purchase</td>
                  <td style={{...tdStyle, color: '#00d084', textAlign: 'right'}}>+1,000</td>
                  <td style={{...tdStyle, textAlign: 'right'}}>8,500</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Jan 09, 2025</td>
                  <td style={tdStyle}>API Usage</td>
                  <td style={{...tdStyle, color: '#ff6b6b', textAlign: 'right'}}>-250</td>
                  <td style={{...tdStyle, textAlign: 'right'}}>7,500</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Jan 08, 2025</td>
                  <td style={tdStyle}>Referral Bonus</td>
                  <td style={{...tdStyle, color: '#00d084', textAlign: 'right'}}>+500</td>
                  <td style={{...tdStyle, textAlign: 'right'}}>7,750</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Jan 07, 2025</td>
                  <td style={tdStyle}>Image Generation</td>
                  <td style={{...tdStyle, color: '#ff6b6b', textAlign: 'right'}}>-100</td>
                  <td style={{...tdStyle, textAlign: 'right'}}>7,250</td>
                </tr>
                <tr>
                  <td style={{...tdStyle, borderBottom: 'none'}}>Jan 06, 2025</td>
                  <td style={{...tdStyle, borderBottom: 'none'}}>Monthly Bonus</td>
                  <td style={{...tdStyle, color: '#00d084', textAlign: 'right', borderBottom: 'none'}}>+200</td>
                  <td style={{...tdStyle, textAlign: 'right', borderBottom: 'none'}}>7,350</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Coupons Usage Card */}
        <div className="balance-card" style={{ 
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'rgba(255, 87, 34, 0.15)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiTag size={20} color="#ff5722" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 }}>Coupons Usage</h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Coupon</th>
                  <th style={thStyle}>Discount</th>
                  <th style={{...thStyle, textAlign: 'center'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>Jan 10, 2025</td>
                  <td style={tdStyle}>SAVE20</td>
                  <td style={tdStyle}>20% off</td>
                  <td style={{...tdStyle, textAlign: 'center'}}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      background: 'rgba(0, 208, 132, 0.15)',
                      color: '#00d084'
                    }}>Used</span>
                  </td>
                </tr>
                <tr>
                  <td style={tdStyle}>Jan 05, 2025</td>
                  <td style={tdStyle}>NEWYEAR50</td>
                  <td style={tdStyle}>50% off</td>
                  <td style={{...tdStyle, textAlign: 'center'}}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      background: 'rgba(0, 208, 132, 0.15)',
                      color: '#00d084'
                    }}>Used</span>
                  </td>
                </tr>
                <tr>
                  <td style={tdStyle}>Available</td>
                  <td style={tdStyle}>FLASH30</td>
                  <td style={tdStyle}>30% off</td>
                  <td style={{...tdStyle, textAlign: 'center'}}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      background: 'rgba(121, 74, 255, 0.15)',
                      color: '#794aff'
                    }}>Active</span>
                  </td>
                </tr>
                <tr>
                  <td style={{...tdStyle, borderBottom: 'none'}}>Available</td>
                  <td style={{...tdStyle, borderBottom: 'none'}}>FRIEND10</td>
                  <td style={{...tdStyle, borderBottom: 'none'}}>$10 off</td>
                  <td style={{...tdStyle, textAlign: 'center', borderBottom: 'none'}}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      background: 'rgba(121, 74, 255, 0.15)',
                      color: '#794aff'
                    }}>Active</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}