"use client";

const SatisfactionRate = () => {
  const percentage = 76.54;
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="satisfaction-card">
      <h3 className="card-title">Satisfaction rate</h3>
      
      <div className="satisfaction-chart">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="circular-progress"
        >
          {/* Background circle */}
          <circle
            stroke="#2a2d3a"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          
          {/* Progress circle */}
          <circle
            stroke="#00b4d8"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
            className="progress-circle"
          />
        </svg>
        
        <div className="satisfaction-content">
          <div className="satisfaction-percentage">
            {percentage}%
          </div>
          <div className="satisfaction-label">Based on likes</div>
          <div className="satisfaction-icon">📈</div>
        </div>
      </div>
      
      <div className="satisfaction-footer">
        <span className="footer-text">100%</span>
      </div>
    </div>
  );
};

export default SatisfactionRate;