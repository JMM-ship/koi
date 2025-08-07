"use client";

const VisitsByLocation = () => {
  const locations = [
    { country: "USA", flag: "🇺🇸", percentage: 5.8, trend: "up" },
    { country: "Canada", flag: "🇨🇦", percentage: 51.2, trend: "down" },
    { country: "Germany", flag: "🇩🇪", percentage: 17.1, trend: "up" },
    { country: "Mexico", flag: "🇲🇽", percentage: 15.8, trend: "down" },
    { country: "France", flag: "🇫🇷", percentage: 9.8, trend: "up" },
  ];

  return (
    <div className="visits-location-card">
      <div className="card-header">
        <h3 className="card-title">Visits by Location</h3>
        <button className="see-all-btn">SEE ALL &gt;</button>
      </div>

      <div className="locations-list">
        {locations.map((location, index) => (
          <div key={index} className="location-item">
            <div className="location-info">
              <span className="country-flag">{location.flag}</span>
              <span className="country-name">{location.country}</span>
            </div>
            <div className="location-stats">
              <span className={`trend-icon ${location.trend}`}>
                {location.trend === "up" ? "↑" : "↓"}
              </span>
              <span className="percentage">{location.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisitsByLocation;