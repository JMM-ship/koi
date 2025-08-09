"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import CurrentPlan from "@/components/dashboard/VisitsByLocation";
import "@/public/assets/css/dashboard.css";

export default function Subscription() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="dashboard-container">
      <Sidebar onCollapsedChange={setIsSidebarCollapsed} />

      <div className={`dashboard-main ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="dashboard-content">
          <div className="dashboard-header mb-4">
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>My Subscription</h1>
            <p style={{ fontSize: '14px', color: '#999' }}>Manage your subscription and billing information</p>
          </div>

          <div className="dashboard-grid">
            <div className="main-content">
              <div className="row">
                <div className="col-md-4 mb-4">
                  <CurrentPlan />
                </div>
                
                <div className="col-md-8 mb-4">
                  <div className="balance-card" style={{ 
                    background: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '12px',
                    padding: '20px',
                    height: '100%'
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '20px' }}>Usage History</h3>
                    
                    <div className="table-responsive">
                      <table className="table" style={{ color: '#fff' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                            <th style={{ color: '#666', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', padding: '12px 8px' }}>Date</th>
                            <th style={{ color: '#666', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', padding: '12px 8px' }}>Type</th>
                            <th style={{ color: '#666', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', padding: '12px 8px' }}>Usage</th>
                            <th style={{ color: '#666', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', padding: '12px 8px' }}>Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>Jan 10, 2025</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>API Calls</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>1,250</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px', color: '#794aff' }}>$2.50</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>Jan 09, 2025</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>Storage</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>0.5 GB</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px', color: '#794aff' }}>$0.50</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>Jan 08, 2025</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>API Calls</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>2,100</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px', color: '#794aff' }}>$4.20</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12">
                  <div className="balance-card" style={{ 
                    background: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '20px' }}>Billing History</h3>
                    
                    <div className="table-responsive">
                      <table className="table" style={{ color: '#fff' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                            <th style={{ color: '#666', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', padding: '12px 8px' }}>Invoice</th>
                            <th style={{ color: '#666', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', padding: '12px 8px' }}>Date</th>
                            <th style={{ color: '#666', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', padding: '12px 8px' }}>Amount</th>
                            <th style={{ color: '#666', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', padding: '12px 8px' }}>Status</th>
                            <th style={{ color: '#666', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', padding: '12px 8px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>#INV-2025-001</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>Dec 15, 2024</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>$29.00</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: '#00d084', color: '#000' }}>Paid</span>
                            </td>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>
                              <button style={{ color: '#794aff', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Download</button>
                            </td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>#INV-2024-012</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>Nov 15, 2024</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>$29.00</td>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: '#00d084', color: '#000' }}>Paid</span>
                            </td>
                            <td style={{ fontSize: '13px', padding: '12px 8px' }}>
                              <button style={{ color: '#794aff', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Download</button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}