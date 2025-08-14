"use client";

import { useState } from "react";

const ExchangeBalance = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const rankingData = {
    today: {
      points: "2,847",
      percentage: 88,
      trend: "+12%",
      color: "#00d084"
    },
    week: {
      points: "18,234",
      percentage: 72,
      trend: "+8%",
      color: "#00b4d8"
    },
    month: {
      points: "65,892",
      percentage: 55,
      trend: "+15%",
      color: "#ffa500"
    }
  };

  const currentData = rankingData[selectedPeriod];

  return (
    <div className="team-members-card">
      <div className="card-header">
        <h3 className="card-title">Credits Details</h3>
        <div className="period-switcher" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setSelectedPeriod('today')}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: selectedPeriod === 'today' ? '#00d084' : '#2a2b35',
              color: '#fff',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedPeriod('week')}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: selectedPeriod === 'week' ? '#00d084' : '#2a2b35',
              color: '#fff',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            7 Days
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: selectedPeriod === 'month' ? '#00d084' : '#2a2b35',
              color: '#fff',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="team-list" style={{ padding: '1.25rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                {currentData.points}
              </span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                Credits Consumed
              </span>
            </div>
            <span style={{ fontSize: '0.875rem', color: currentData.color }}>
              {currentData.trend}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                Performance Ranking
              </span>
              <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: currentData.color }}>
                {currentData.percentage}%
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              Better than {currentData.percentage}% of users
            </div>
            <div style={{ 
              width: '100%', 
              height: '0.625rem', 
              backgroundColor: '#1e1f26', 
              borderRadius: '0.3125rem',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${currentData.percentage}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${currentData.color}, ${currentData.color}dd)`,
                borderRadius: '0.3125rem',
                transition: 'width 0.5s ease-in-out',
                boxShadow: `0 0 0.625rem ${currentData.color}50`
              }} />
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid #2a2b35'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>
              {selectedPeriod === 'today' ? '24h' : selectedPeriod === 'week' ? '7d' : '30d'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Period</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: currentData.color }}>
              {currentData.percentage}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Better Than</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeBalance;