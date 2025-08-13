"use client";

import { useState } from "react";

const ExchangeBalance = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const rankingData = {
    today: {
      points: "2,847",
      rank: 12,
      totalUsers: 100,
      percentage: 88,
      trend: "+12%",
      color: "#00d084"
    },
    week: {
      points: "18,234",
      rank: 28,
      totalUsers: 100,
      percentage: 72,
      trend: "+8%",
      color: "#00b4d8"
    },
    month: {
      points: "65,892",
      rank: 45,
      totalUsers: 100,
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
        <div className="period-switcher" style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSelectedPeriod('today')}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              border: 'none',
              background: selectedPeriod === 'today' ? '#00d084' : '#2a2b35',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedPeriod('week')}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              border: 'none',
              background: selectedPeriod === 'week' ? '#00d084' : '#2a2b35',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            7 Days
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              border: 'none',
              background: selectedPeriod === 'month' ? '#00d084' : '#2a2b35',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="team-list" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
                {currentData.points}
              </span>
              <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '8px' }}>
                Credits Consumed
              </span>
            </div>
            <span style={{ fontSize: '14px', color: currentData.color }}>
              {currentData.trend}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#9ca3af' }}>
              Current Ranking
            </span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: currentData.color }}>
              #{currentData.rank}
            </span>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                Top {currentData.percentage}%
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                Better than {currentData.percentage}% of users
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
                width: `${currentData.percentage}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${currentData.color}, ${currentData.color}dd)`,
                borderRadius: '4px',
                transition: 'width 0.5s ease-in-out',
                boxShadow: `0 0 10px ${currentData.color}50`
              }} />
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #2a2b35'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              {selectedPeriod === 'today' ? '24h' : selectedPeriod === 'week' ? '7d' : '30d'}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Period</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: currentData.color }}>
              #{currentData.rank}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Rank</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00d084' }}>
              {currentData.percentage}%
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Percentile</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeBalance;