"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from 'swr'
import * as echarts from 'echarts';
import "@/public/assets/css/dashboard-chart.css";

const WorkSummaryChart = () => {
  const [selectedType, setSelectedType] = useState("points");
  const [chartHeight, setChartHeight] = useState(280);
  const { data: consumptionData } = useSWR(`/api/dashboard/consumption-trends?days=7&type=${selectedType}`,
    async (url: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        const chartData = result.data.map((item: any) => item.value);
        const dateLabels = result.data.map((item: any) => item.date);
        const maxValue = Math.max(...chartData) * 1.2;
        const colorScheme = {
          points: { color: '#794aff', glowColor: '#b084ff' },
          money: { color: '#00b4d8', glowColor: '#00e5ff' },
          tokens: { color: '#00d084', glowColor: '#00ff9f' }
        } as const;
        return {
          data: chartData,
          dateLabels,
          unit: result.stats.unit,
          total: result.stats.total,
          increase: result.stats.increase,
          percentage: result.stats.percentage,
          ...(colorScheme as any)[selectedType],
          max: maxValue || 100
        };
      } catch (error) {
        // 返回默认数据
        return {
          data: [0, 0, 0, 0, 0, 0, 0],
          dateLabels: generateDefaultDateLabels(),
          unit: selectedType === 'money' ? 'USD' : selectedType === 'tokens' ? 'Tokens' : 'Points',
          total: 0,
          increase: 0,
          percentage: '+0%',
          color: '#794aff',
          glowColor: '#b084ff',
          max: 100
        };
      }
    }
  )
  const loading = !consumptionData;
  const chartRef = useRef<HTMLDivElement>(null);

  // 获取消费趋势数据
  const fetchConsumptionData = async (type: string) => {
    try {
      const response = await fetch(`/api/dashboard/consumption-trends?days=7&type=${type}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();

      // 格式化数据以适配图表
      const chartData = result.data.map((item: any) => item.value);
      const dateLabels = result.data.map((item: any) => item.date);

      // 计算最大值
      const maxValue = Math.max(...chartData) * 1.2; // 留20%空间

      // 设置颜色方案
      const colorScheme = {
        points: { color: '#794aff', glowColor: '#b084ff' },
        money: { color: '#00b4d8', glowColor: '#00e5ff' },
        tokens: { color: '#00d084', glowColor: '#00ff9f' }
      };

      return {
        data: chartData,
        dateLabels,
        unit: result.stats.unit,
        total: result.stats.total,
        increase: result.stats.increase,
        percentage: result.stats.percentage,
        ...colorScheme[type as keyof typeof colorScheme],
        max: maxValue || 100
      };
    } catch (error) {
      console.error('Error fetching consumption data:', error);
      // 返回默认数据
      return {
        data: [0, 0, 0, 0, 0, 0, 0],
        dateLabels: generateDefaultDateLabels(),
        unit: type === 'money' ? 'USD' : type === 'tokens' ? 'Tokens' : 'Points',
        total: 0,
        increase: 0,
        percentage: '+0%',
        color: '#794aff',
        glowColor: '#b084ff',
        max: 100
      };
    }
  };

  // 生成默认日期标签
  const generateDefaultDateLabels = () => {
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

  // 加载数据由 SWR 上方负责

  // 响应式高度调整
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        setChartHeight(200);
      } else if (width <= 768) {
        setChartHeight(240);
      } else {
        setChartHeight(280);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!chartRef.current || !consumptionData || loading) return;

    const myChart = echarts.init(chartRef.current);
    const currentData = consumptionData;

    const option = {
      backgroundColor: 'transparent',
      grid: {
        top: 20,
        right: 10,
        bottom: 40,
        left: 50,
        containLabel: false
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: currentData.dateLabels || [],
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
            color: currentData.glowColor,
            shadowColor: currentData.glowColor,
            shadowBlur: 20,
            borderColor: currentData.glowColor,
            borderWidth: 2
          },
          lineStyle: {
            width: 3,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: currentData.color },
              { offset: 0.5, color: currentData.glowColor },
              { offset: 1, color: currentData.color }
            ]),
            shadowColor: currentData.glowColor,
            shadowBlur: 15,
            shadowOffsetY: 0
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: `${currentData.glowColor}40`
              },
              {
                offset: 0.5,
                color: `${currentData.color}20`
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
  }, [consumptionData, chartHeight, loading]);

  if (loading || !consumptionData) {
    return (
      <div className="work-summary-card">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <span style={{ color: '#999' }}>Loading...</span>
        </div>
      </div>
    );
  }

  const currentData = consumptionData;

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
    const max = currentData?.max || 100;
    const labels = [];
    for (let i = 0; i <= 5; i++) {
      const value = (max / 5) * i;
      if (selectedType === 'money') {
        labels.push(`$${value.toFixed(0)}`);
      } else if (selectedType === 'tokens') {
        labels.push(`${(value / 1000).toFixed(0)}K`);
      } else {
        labels.push(value.toFixed(0));
      }
    }
    return labels.reverse(); // 反转数组，使最大值在顶部
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
          {/* <button
            className={`period-tab ${selectedType === "tokens" ? "active" : ""}`}
            onClick={() => setSelectedType("tokens")}
          >
            Tokens
          </button> */}
        </div>
      </div>

      <div className="date-range">Last 7 Days</div>

      <div className="chart-wrapper">
        <div className="chart-y-axis" style={{ height: `${chartHeight}px`, paddingTop: '20px', paddingBottom: '40px' }}>
          {getYAxisLabels().map((label, index) => (
            <span key={index} style={{ lineHeight: index === 0 ? '0' : '1' }}>{label}</span>
          ))}
        </div>

        <div ref={chartRef} className="echarts-container" style={{ width: '100%', height: `${chartHeight}px`, minHeight: `${chartHeight}px` }}></div>
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
