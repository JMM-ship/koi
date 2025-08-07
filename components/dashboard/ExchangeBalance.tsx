"use client";

const ExchangeBalance = () => {
  const balances = [
    {
      id: 1,
      label: "Exchange Balance",
      amount: "0.213435345",
      usdValue: "3,897.98 USD",
      change: "-0.32%",
      color: "blue",
      chartData: [40, 60, 45, 70, 50, 80, 60]
    },
    {
      id: 2,
      label: "Exchange Balance",
      amount: "0.213435345",
      usdValue: "3,897.98 USD", 
      change: "-0.32%",
      color: "red",
      chartData: [60, 40, 55, 45, 65, 35, 50]
    },
    {
      id: 3,
      label: "Exchange Balance",
      amount: "0.213435345",
      usdValue: "3,897.98 USD",
      change: "-0.32%",
      color: "green",
      chartData: [30, 50, 40, 60, 45, 55, 40]
    }
  ];

  const renderMiniChart = (data: number[], color: string) => {
    const width = 100;
    const height = 40;
    const max = Math.max(...data);
    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * width,
      y: height - (value / max) * height
    }));

    const path = points.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      return `${acc} L ${point.x} ${point.y}`;
    }, "");

    return (
      <svg width={width} height={height} className="mini-chart">
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      </svg>
    );
  };

  return (
    <div className="exchange-balances">
      {balances.map((balance) => (
        <div key={balance.id} className="balance-card">
          <div className="balance-header">
            <span className="balance-label">{balance.label}</span>
          </div>
          
          <div className="balance-amount">{balance.amount}</div>
          <div className="balance-usd">{balance.usdValue}</div>
          
          <div className="balance-footer">
            <span className={`balance-change ${balance.change.startsWith("-") ? "negative" : "positive"}`}>
              {balance.change}
            </span>
            {renderMiniChart(balance.chartData, 
              balance.color === "blue" ? "#00b4d8" : 
              balance.color === "red" ? "#ff006e" : 
              "#00d084"
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExchangeBalance;