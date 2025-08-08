"use client";

import { useState, useEffect, useRef } from "react";
import * as echarts from 'echarts';
import "@/public/assets/css/dashboard-chart.css";

const WorkSummaryChart = () => {
  const [selectedType, setSelectedType] = useState("points");
  const chartRef = useRef<HTMLDivElement>(null);

  // 生成最近7天的日期
  const generateDateLabels = () => {
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      dates.push(`${month}/${day}`);
    }
    return dates;
  };

  const dateLabels = generateDateLabels();

  // 不同类型的数据
  const consumptionData = {
    points: {
      data: [1200, 1800, 1500, 2100, 1900, 1600, 2200],
      unit: 'Points',
      total: 12100,
      increase: 326,
      percentage: '+2.8%',
      color: '#794aff',
      max: 2500
    },
    money: {
      data: [45.5, 68.2, 52.3, 78.6, 71.4, 60.8, 82.5],
      unit: 'USD',
      total: 459.30,
      increase: 28.50,
      percentage: '+6.6%',
      color: '#00b4d8',
      max: 100
    },
    tokens: {
      data: [85000, 125000, 95000, 142000, 135000, 108000, 155000],
      unit: 'Tokens',
      total: 845000,
      increase: 52000,
      percentage: '+6.6%',
      color: '#00d084',
      max: 200000
    }
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = echarts.init(chartRef.current);
    const currentData = consumptionData[selectedType as keyof typeof consumptionData];

    const option = {
      backgroundColor: 'transparent',
      grid: {
        top: 20,
        right: 20,
        bottom: 40,
        left: 60,
        containLabel: false
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dateLabels,
        axisLine: {
          lineStyle: {
            color: '#2a2d3a'
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#999',
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: currentData.max,
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
          name: 'Consumption',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          sampling: 'average',
          itemStyle: {
            color: currentData.color,
            shadowColor: `${currentData.color}88`,
            shadowBlur: 10
          },
          lineStyle: {
            width: 3,
            color: currentData.color,
            shadowColor: `${currentData.color}88`,
            shadowBlur: 10
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: `${currentData.color}33`
              },
              {
                offset: 1,
                color: `${currentData.color}00`
              }
            ])
          },
          data: currentData.data,
        }
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(22, 23, 29, 0.9)',
        borderColor: '#2a2d3a',
        textStyle: {
          color: '#fff'
        },
        formatter: function (params: any) {
          const value = params[0].value;
          const formattedValue = selectedType === 'money'
            ? `$${value.toFixed(2)}`
            : value.toLocaleString();
          return `${params[0].axisValue}<br/>
                  <span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${currentData.color};"></span>
                  Consumption: ${formattedValue} ${currentData.unit}`;
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
  }, [selectedType]);

  const currentData = consumptionData[selectedType as keyof typeof consumptionData];

  // 格式化显示的总数
  const formatTotal = () => {
    if (selectedType === 'money') {
      return `$${currentData.total.toFixed(2)}`;
    } else if (selectedType === 'tokens') {
      return (currentData.total / 1000).toFixed(0) + 'K';
    }
    return currentData.total.toLocaleString();
  };

  // 格式化Y轴标签
  const getYAxisLabels = () => {
    const max = currentData.max;
    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const value = (max / 5) * i;
      if (selectedType === 'money') {
        labels.push(`$${value.toFixed(0)}`);
      } else if (selectedType === 'tokens') {
        labels.push(`${(value / 1000).toFixed(0)}K`);
      } else {
        labels.push(value.toFixed(0));
      }
    }
    return labels;
  };

  return (
    <div className="work-summary-card">
      <div className="card-header">
        <h3 className="card-title">Consumption Trends</h3>
        <div className="period-tabs">
          <button
            className={`period-tab ${selectedType === "points" ? "active" : ""}`}
            onClick={() => setSelectedType("points")}
          >
            Points
          </button>
          <button
            className={`period-tab ${selectedType === "money" ? "active" : ""}`}
            onClick={() => setSelectedType("money")}
          >
            Money
          </button>
          <button
            className={`period-tab ${selectedType === "tokens" ? "active" : ""}`}
            onClick={() => setSelectedType("tokens")}
          >
            Tokens
          </button>
        </div>
      </div>

      <div className="date-range">Last 7 Days</div>

      <div className="chart-wrapper">
        <div className="chart-y-axis">
          {getYAxisLabels().map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>

        <div ref={chartRef} className="echarts-container" style={{ width: '100%', height: '280px' }}></div>
      </div>

      <div className="chart-legends">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: currentData.color }}></span>
          <span className="legend-text">Weekly Average</span>
          <span className="legend-value" style={{ color: currentData.color }}>
            {(currentData.total / 7).toFixed(0)} {currentData.unit}/day
          </span>
        </div>
      </div>

      <div className="chart-bottom-section">
        <div className="total-signups">
          <div className="signups-number">{formatTotal()}</div>
          <div className="signups-info">
            <span className="signups-badge" style={{ background: currentData.percentage.startsWith('+') ? '#00d084' : '#ff006e' }}>
              {currentData.percentage}
            </span>
            <span className="signups-text">Total {currentData.unit} consumed this week</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkSummaryChart;