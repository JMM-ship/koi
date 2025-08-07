"use client";

import { useState } from "react";

const WorkSummaryChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");

  // 模拟图表数据点
  const generateChartPath = () => {
    const width = 600;
    const height = 250;
    const points = 50;

    // 生成随机数据点
    const data = Array.from({ length: points }, (_, i) => ({
      x: (i / points) * width,
      y: height / 2 + Math.sin(i * 0.3) * 60 + Math.random() * 30
    }));

    // 创建SVG路径
    const path = data.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      return `${acc} L ${point.x} ${point.y}`;
    }, "");

    return path;
  };

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

      <div className="chart-container">
        <svg viewBox="0 0 600 300" className="chart-svg">
          {/* 网格线 */}
          <g className="grid-lines">
            {[0, 100, 200, 300, 400].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y * 0.75}
                x2="600"
                y2={y * 0.75}
                stroke="#2a2d3a"
                strokeDasharray="5,5"
                opacity="0.3"
              />
            ))}
          </g>

          {/* 蓝色线条 */}
          <path
            d={generateChartPath()}
            fill="none"
            stroke="#00b4d8"
            strokeWidth="3"
            className="chart-line-blue"
          />

          {/* 红色线条 */}
          <path
            d={generateChartPath()}
            fill="none"
            stroke="#ff006e"
            strokeWidth="3"
            className="chart-line-red"
          />
        </svg>

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
      </div>

      <div className="chart-values">
        <div className="y-axis-labels">
          <span>500</span>
          <span>400</span>
          <span>300</span>
          <span>200</span>
          <span>100</span>
          <span>0</span>
        </div>
      </div>

      <div className="total-signups">
        <div className="signups-number">9845</div>
        <div className="signups-info">
          <span className="signups-badge">826</span>
          <span className="signups-text">Sign-Ups past 30 days</span>
        </div>
      </div>
    </div>
  );
};

export default WorkSummaryChart;