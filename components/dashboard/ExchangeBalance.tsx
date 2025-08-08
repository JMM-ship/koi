"use client";

import { useEffect, useRef } from "react";
import * as echarts from 'echarts';

const ExchangeBalance = () => {
  const chartRefs = useRef<(HTMLDivElement | null)[]>([]);

  const rankings = [
    {
      id: 1,
      label: "Today",
      period: "24 hours",
      points: "2,847",
      rank: "#12",
      outperformed: 85,
      color: "#794aff",
      trend: "+12%"
    },
    {
      id: 2,
      label: "This Week",
      period: "7 days",
      points: "18,234",
      rank: "#28",
      outperformed: 72,
      color: "#00b4d8",
      trend: "+8%"
    },
    {
      id: 3,
      label: "This Month",
      period: "30 days",
      points: "65,892",
      rank: "#45",
      outperformed: 68,
      color: "#00d084",
      trend: "+15%"
    }
  ];

  useEffect(() => {
    const charts: echarts.ECharts[] = [];

    rankings.forEach((ranking, index) => {
      if (chartRefs.current[index]) {
        const myChart = echarts.init(chartRefs.current[index]!);
        charts.push(myChart);

        const option = {
          backgroundColor: 'transparent',
          series: [
            {
              type: 'gauge',
              startAngle: 90,
              endAngle: -270,
              radius: '100%',
              center: ['50%', '50%'],
              pointer: {
                show: false
              },
              progress: {
                show: true,
                overlap: false,
                roundCap: true,
                clip: false,
                itemStyle: {
                  color: ranking.color,
                  shadowBlur: 10,
                  shadowColor: ranking.color
                }
              },
              axisLine: {
                lineStyle: {
                  width: 8,
                  color: [[1, '#1e1f26']]
                }
              },
              splitLine: {
                show: false
              },
              axisTick: {
                show: false
              },
              axisLabel: {
                show: false
              },
              data: [
                {
                  value: ranking.outperformed,
                  detail: {
                    valueAnimation: true,
                    offsetCenter: ['0%', '0%'],
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#fff',
                    formatter: '{value}%'
                  }
                }
              ],
              detail: {
                fontSize: 16,
                fontWeight: 'bold',
                color: '#fff',
                formatter: '{value}%',
                offsetCenter: ['0%', '0%']
              },
              animationDuration: 1000,
              animationEasing: 'cubicOut'
            }
          ]
        };

        myChart.setOption(option);
      }
    });

    const handleResize = () => {
      charts.forEach(chart => chart.resize());
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      charts.forEach(chart => chart.dispose());
    };
  }, []);

  return (
    <div className="exchange-balances">
      <div className="ranking-header">
        <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '15px' }}>Points Consumption Ranking</h3>
      </div>
      {rankings.map((ranking, index) => (
        <div key={ranking.id} className="balance-card">
          <div className="balance-content">
            <div className="balance-header">
              <span className="balance-label">{ranking.label}</span>
              <span style={{ color: '#666', fontSize: '11px', marginLeft: '8px' }}>({ranking.period})</span>
            </div>
            <div className="balance-amount" style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span>{ranking.points}</span>
              <span style={{ fontSize: '14px', color: ranking.color }}>{ranking.rank}</span>
            </div>
            <div className="balance-usd" style={{ fontSize: '12px', color: '#999' }}>
              Outperformed {ranking.outperformed}% of users
            </div>
          </div>
          <div className="balance-chart-container">
            <div
              ref={el => { chartRefs.current[index] = el; }}
              className="balance-ring-chart"
              style={{ width: '80px', height: '80px' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExchangeBalance;