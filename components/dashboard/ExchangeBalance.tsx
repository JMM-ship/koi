"use client";

import { useEffect, useRef } from "react";
import * as echarts from 'echarts';

const ExchangeBalance = () => {
  const chartRefs = useRef<(HTMLDivElement | null)[]>([]);

  const balances = [
    {
      id: 1,
      label: "Exchange Balance",
      amount: "0.213435345",
      usdValue: "3,897.98 USD",
      change: "-0.32%",
      color: "#00b4d8",
      percentage: 68
    },
    {
      id: 2,
      label: "Exchange Balance",
      amount: "0.213435345",
      usdValue: "3,897.98 USD",
      change: "-0.32%",
      color: "#ff006e",
      percentage: 45
    },
    {
      id: 3,
      label: "Exchange Balance",
      amount: "0.213435345",
      usdValue: "3,897.98 USD",
      change: "-0.32%",
      color: "#00d084",
      percentage: 75
    }
  ];

  useEffect(() => {
    const charts: echarts.ECharts[] = [];

    balances.forEach((balance, index) => {
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
                  color: balance.color,
                  shadowBlur: 10,
                  shadowColor: balance.color
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
                  value: balance.percentage,
                  detail: {
                    valueAnimation: true,
                    offsetCenter: ['0%', '0%'],
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#fff',
                    formatter: balance.change
                  }
                }
              ],
              detail: {
                fontSize: 14,
                color: '#fff',
                formatter: balance.change,
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
      {balances.map((balance, index) => (
        <div key={balance.id} className="balance-card">
          <div className="balance-content">
            <div className="balance-header">
              <span className="balance-label">{balance.label}</span>
            </div>
            <div className="balance-amount">{balance.amount}</div>
            <div className="balance-usd">{balance.usdValue}</div>
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