"use client";

import { useEffect, useRef } from "react";
import * as echarts from 'echarts';

const SatisfactionRate = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const totalCredits = 10000; // 总积分
  const usedCredits = 3480; // 已使用积分
  const remainingCredits = totalCredits - usedCredits; // 剩余积分
  const percentage = (remainingCredits / totalCredits) * 100; // 剩余百分比

  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = echarts.init(chartRef.current);

    const option = {
      backgroundColor: 'transparent',
      series: [
        {
          name: 'Background',
          type: 'gauge',
          radius: '85%',
          center: ['50%', '55%'],
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 0,
          pointer: {
            show: false
          },
          progress: {
            show: false
          },
          axisLine: {
            lineStyle: {
              width: 12,
              color: [[1, '#2a2d3a']]
            }
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          title: {
            show: false
          },
          detail: {
            show: false
          }
        },
        {
          name: 'Progress',
          type: 'gauge',
          radius: '85%',
          center: ['50%', '55%'],
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 0,
          pointer: {
            show: true,
            length: '0%',
            width: 8,
            icon: 'circle',
            offsetCenter: [0, '-75%'],
            itemStyle: {
              color: '#fff',
              borderColor: '#00b4d8',
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: '#00b4d8'
            }
          },
          progress: {
            show: true,
            overlap: false,
            roundCap: true,
            clip: false,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  {
                    offset: 0,
                    color: '#00b4d8'
                  },
                  {
                    offset: 1,
                    color: '#0090ff'
                  }
                ],
                global: false
              },
              shadowBlur: 20,
              shadowColor: '#00b4d8'
            }
          },
          axisLine: {
            lineStyle: {
              width: 12,
              color: [[0, 'transparent'], [1, 'transparent']]
            }
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
          axisLabel: {
            show: true,
            color: '#5a5c66',
            fontSize: 11,
            distance: -45,
            formatter: function (value: number) {
              if (value === 0) return '0%';
              if (value === 100) return '100%';
              return '';
            }
          },
          title: {
            show: false
          },
          detail: {
            show: false
          },
          data: [{
            value: percentage
          }]
        }
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '55%',
          style: {
            text: `${remainingCredits.toLocaleString()}`,
            fontSize: 32,
            fontWeight: 600,
            fill: '#fff',
            textAlign: 'center'
          }
        },
        {
          type: 'text',
          left: 'center',
          top: '70%',
          style: {
            text: `Remaining / ${totalCredits.toLocaleString()} Credits`,
            fontSize: 13,
            fill: '#8b8d97',
            textAlign: 'center'
          }
        },
        {
          type: 'text',
          left: 'center',
          top: '35%',
          style: {
            text: '💎',
            fontSize: 24,
            textAlign: 'center'
          }
        }
      ]
    };

    myChart.setOption(option);

    // Add animation
    let currentValue = 0;
    const animationDuration = 1500;
    const steps = 60;
    const increment = percentage / steps;
    let frame = 0;

    const animate = () => {
      if (frame < steps) {
        currentValue = Math.min(currentValue + increment, percentage);
        myChart.setOption({
          series: [{}, {
            data: [{ value: currentValue }]
          }],
          graphic: [
            {
              style: {
                text: `${Math.round((currentValue / 100) * totalCredits).toLocaleString()}`
              }
            },
            {},
            {}
          ]
        });
        frame++;
        requestAnimationFrame(animate);
      }
    };

    setTimeout(() => {
      animate();
    }, 100);

    const handleResize = () => {
      myChart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, []);

  return (
    <div className="satisfaction-card">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 className="card-title" style={{ margin: 0 }}>Credits Balance</h3>
      </div>

      <div
        ref={chartRef}
        className="satisfaction-chart-echarts"
        style={{ width: '100%', height: '220px' }}
      />
    </div>
  );
};

export default SatisfactionRate;