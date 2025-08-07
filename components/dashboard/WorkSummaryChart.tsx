"use client";

import { useState, useEffect, useRef } from "react";
import * as echarts from 'echarts';
import "@/public/assets/css/dashboard-chart.css";

const WorkSummaryChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = echarts.init(chartRef.current);

    const option = {
      backgroundColor: 'transparent',
      grid: {
        top: 20,
        right: 20,
        bottom: 60,
        left: 60,
        containLabel: false
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 500,
        interval: 100,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#2a2d3a',
            type: 'dashed',
            opacity: 0.3
          }
        }
      },
      series: [
        {
          name: 'Last Month',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          sampling: 'average',
          itemStyle: {
            color: '#00b4d8',
            shadowColor: 'rgba(0, 180, 216, 0.5)',
            shadowBlur: 10
          },
          lineStyle: {
            width: 3,
            color: '#00b4d8',
            shadowColor: 'rgba(0, 180, 216, 0.5)',
            shadowBlur: 10
          },
          data: [420, 200, 380, 340, 480, 320, 420, 450, 480],
          markPoint: {
            symbol: 'circle',
            symbolSize: 10,
            itemStyle: {
              color: '#00b4d8',
              borderColor: '#fff',
              borderWidth: 2
            },
            data: [
              { coord: [3, 340], value: 340 }
            ]
          }
        },
        {
          name: 'This Month',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          sampling: 'average',
          itemStyle: {
            color: '#ff006e',
            shadowColor: 'rgba(255, 0, 110, 0.5)',
            shadowBlur: 10
          },
          lineStyle: {
            width: 3,
            color: '#ff006e',
            shadowColor: 'rgba(255, 0, 110, 0.5)',
            shadowBlur: 10
          },
          data: [350, 250, 400, 380, 150, 450, 200, 400, 380],
          markPoint: {
            symbol: 'circle',
            symbolSize: 10,
            itemStyle: {
              color: '#ff006e',
              borderColor: '#fff',
              borderWidth: 2
            },
            data: [
              { coord: [5, 450], value: 450 }
            ]
          }
        }
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(22, 23, 29, 0.9)',
        borderColor: '#2a2d3a',
        textStyle: {
          color: '#fff'
        },
        formatter: function(params: any) {
          let result = params[0].axisValue + '<br/>';
          params.forEach((item: any) => {
            result += `<span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${item.color};"></span>${item.seriesName}: ${item.value}<br/>`;
          });
          return result;
        }
      }
    };

    myChart.setOption(option);

    const handleResize = () => {
      myChart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [selectedPeriod]);

  return (
    <div className="work-summary-card">
      <div className="card-header">
        <h3 className="card-title">Your work summary</h3>
        <div className="period-tabs">
          <button
            className={`period-tab ${selectedPeriod === "daily" ? "active" : ""}`}
            onClick={() => setSelectedPeriod("daily")}
          >
            Daily
          </button>
          <button
            className={`period-tab ${selectedPeriod === "monthly" ? "active" : ""}`}
            onClick={() => setSelectedPeriod("monthly")}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="date-range">Nov - July</div>

      <div className="chart-wrapper">
        <div className="chart-y-axis">
          <span>500</span>
          <span>400</span>
          <span>300</span>
          <span>200</span>
          <span>100</span>
          <span>0</span>
        </div>
        
        <div ref={chartRef} className="echarts-container" style={{ width: '100%', height: '300px' }}></div>
      </div>

      <div className="chart-legends">
        <div className="legend-item">
          <span className="legend-dot blue"></span>
          <span className="legend-text">Last Month</span>
          <span className="legend-value">2.36%</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot red"></span>
          <span className="legend-text">This Month</span>
          <span className="legend-value">2.36%</span>
        </div>
      </div>

      <div className="chart-bottom-section">
        <div className="total-signups">
          <div className="signups-number">9845</div>
          <div className="signups-info">
            <span className="signups-badge">826</span>
            <span className="signups-text">Sign-Ups past 30 days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkSummaryChart;