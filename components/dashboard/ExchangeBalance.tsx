"use client";

import { useState, useEffect } from "react";

const ExchangeBalance = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [rankingData, setRankingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreditStats = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const result = await response.json();

        // 格式化统计数据
        const stats = result.creditStats;
        const formatData = (period: any, color: string) => ({
          points: period.amount.toLocaleString(),
          percentage: period.percentage,
          trend: period.amount > 0 ? `+${((period.amount / 100) * 10).toFixed(0)}%` : '0%',
          color
        });
        setRankingData({
          today: formatData(stats.today, "#00d084"),
          week: formatData(stats.week, "#00b4d8"),
          month: formatData(stats.month, "#ffa500")
        });
      } catch (error) {
        console.error('Error fetching credit stats:', error);
        // 使用默认数据
        setRankingData({
          today: { points: "0", percentage: 0, trend: "+0%", color: "#00d084" },
          week: { points: "0", percentage: 0, trend: "+0%", color: "#00b4d8" },
          month: { points: "0", percentage: 0, trend: "+0%", color: "#ffa500" }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCreditStats();
  }, []);

  if (loading || !rankingData) {
    return (
      <div className="team-members-card">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <span style={{ color: '#999' }}>Loading...</span>
        </div>
      </div>
    );
  }

  const currentData = rankingData[selectedPeriod];

  return (
    <div className="team-members-card">
      <div className="card-header">
        <h3 className="card-title">Credits Consumption Ranking</h3>
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