"use client";

import CurrentPlan from "@/components/dashboard/VisitsByLocation";

export default function SubscriptionContent() {
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

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      <div className="mb-4">
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>My Subscription</h1>
        <p style={{ fontSize: '14px', color: '#999' }}>Manage your subscription and billing information</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
        {/* Current Plan Card */}
        <div>
          <CurrentPlan />
        </div>
        
        {/* Usage History */}
        <div className="balance-card" style={{ 
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: '12px',
          padding: '20px',
          height: 'fit-content'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '20px' }}>Usage History</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Usage</th>
                  <th style={{...thStyle, textAlign: 'right'}}>Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>Jan 10, 2025</td>
                  <td style={tdStyle}>API Calls</td>
                  <td style={tdStyle}>1,250</td>
                  <td style={{...tdStyle, color: '#794aff', textAlign: 'right'}}>$2.50</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Jan 09, 2025</td>
                  <td style={tdStyle}>Storage</td>
                  <td style={tdStyle}>0.5 GB</td>
                  <td style={{...tdStyle, color: '#794aff', textAlign: 'right'}}>$0.50</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Jan 08, 2025</td>
                  <td style={tdStyle}>API Calls</td>
                  <td style={tdStyle}>2,100</td>
                  <td style={{...tdStyle, color: '#794aff', textAlign: 'right'}}>$4.20</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Jan 07, 2025</td>
                  <td style={tdStyle}>Bandwidth</td>
                  <td style={tdStyle}>15 GB</td>
                  <td style={{...tdStyle, color: '#794aff', textAlign: 'right'}}>$1.50</td>
                </tr>
                <tr>
                  <td style={{...tdStyle, borderBottom: 'none'}}>Jan 06, 2025</td>
                  <td style={{...tdStyle, borderBottom: 'none'}}>API Calls</td>
                  <td style={{...tdStyle, borderBottom: 'none'}}>980</td>
                  <td style={{...tdStyle, color: '#794aff', textAlign: 'right', borderBottom: 'none'}}>$1.96</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="balance-card" style={{ 
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '20px' }}>Billing History</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Invoice</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Status</th>
                <th style={{...thStyle, textAlign: 'center'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>#INV-2025-001</td>
                <td style={tdStyle}>Dec 15, 2024</td>
                <td style={tdStyle}>$29.00</td>
                <td style={tdStyle}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    background: 'rgba(0, 208, 132, 0.15)',
                    color: '#00d084',
                    fontWeight: '600',
                    display: 'inline-block'
                  }}>Paid</span>
                </td>
                <td style={{...tdStyle, textAlign: 'center'}}>
                  <button style={{ 
                    color: '#794aff', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '13px',
                    padding: '4px 8px',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#b084ff';
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#794aff';
                    e.currentTarget.style.textDecoration = 'none';
                  }}>
                    Download
                  </button>
                </td>
              </tr>
              <tr>
                <td style={tdStyle}>#INV-2024-012</td>
                <td style={tdStyle}>Nov 15, 2024</td>
                <td style={tdStyle}>$29.00</td>
                <td style={tdStyle}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    background: 'rgba(0, 208, 132, 0.15)',
                    color: '#00d084',
                    fontWeight: '600',
                    display: 'inline-block'
                  }}>Paid</span>
                </td>
                <td style={{...tdStyle, textAlign: 'center'}}>
                  <button style={{ 
                    color: '#794aff', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '13px',
                    padding: '4px 8px',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#b084ff';
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#794aff';
                    e.currentTarget.style.textDecoration = 'none';
                  }}>
                    Download
                  </button>
                </td>
              </tr>
              <tr>
                <td style={{...tdStyle, borderBottom: 'none'}}>#INV-2024-011</td>
                <td style={{...tdStyle, borderBottom: 'none'}}>Oct 15, 2024</td>
                <td style={{...tdStyle, borderBottom: 'none'}}>$29.00</td>
                <td style={{...tdStyle, borderBottom: 'none'}}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    background: 'rgba(0, 208, 132, 0.15)',
                    color: '#00d084',
                    fontWeight: '600',
                    display: 'inline-block'
                  }}>Paid</span>
                </td>
                <td style={{...tdStyle, textAlign: 'center', borderBottom: 'none'}}>
                  <button style={{ 
                    color: '#794aff', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '13px',
                    padding: '4px 8px',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#b084ff';
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#794aff';
                    e.currentTarget.style.textDecoration = 'none';
                  }}>
                    Download
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}