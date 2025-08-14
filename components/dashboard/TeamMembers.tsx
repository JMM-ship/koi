"use client";

import { useState, useEffect } from "react";

const TeamMembers = () => {
  const [creditDetails, setCreditDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModelUsage = async () => {
      try {
        const response = await fetch('/api/dashboard/model-usage?limit=10');
        if (!response.ok) throw new Error('Failed to fetch model usage');
        const result = await response.json();
        
        // 格式化数据
        const formattedData = result.data.map((item: any) => ({
          id: item.id,
          model: item.modelName,
          credits: item.credits,
          timestamp: new Date(item.timestamp).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          type: item.usageType,
          status: item.status
        }));
        
        setCreditDetails(formattedData);
      } catch (error) {
        console.error('Error fetching model usage:', error);
        // 使用默认数据
        setCreditDetails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModelUsage();
  }, []);

  const getModelColor = (model: string) => {
    const colors: { [key: string]: string } = {
      "GPT-4o": "#00d084",
      "GPT-3.5": "#00b4d8",
      "Claude 3.5": "#ffa500",
      "DALL-E 3": "#ff006e",
      "Midjourney": "#8b5cf6"
    };
    return colors[model] || "#6b7280";
  };

  const totalRecords = creditDetails.length;

  if (loading) {
    return (
      <div className="team-members-card">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <span style={{ color: '#999' }}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="team-members-card">
      <div className="card-header">
        <h3 className="card-title">Credits Details</h3>
        <div className="team-location">
          <span>Total {totalRecords} records</span>
        </div>
      </div>

      <div
        className="team-list"
        style={{
          maxHeight: "none",
          overflowY: "hidden",
          paddingRight: "0"
        }}
      >
        {creditDetails.slice(0, 5).map((detail) => (
          <div key={detail.id} className="team-member">
            <div className="member-info">
              <div
                className="model-badge"
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "0.5rem",
                  backgroundColor: getModelColor(detail.model),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  flexShrink: 0
                }}
              >
                {detail.model.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ marginLeft: "0.75rem", flex: 1 }}>
                <div className="member-name" style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                  {detail.model}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {detail.type} · {detail.timestamp}
                </div>
              </div>
            </div>

            <div className="member-stats" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span
                className="member-value"
                style={{
                  fontWeight: 600,
                  fontSize: "1rem",
                  color: getModelColor(detail.model),
                  minWidth: "5rem",
                  textAlign: "right"
                }}
              >
                -{detail.credits} Credits
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamMembers;