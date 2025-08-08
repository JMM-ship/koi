"use client";

const TeamMembers = () => {
  const creditDetails = [
    {
      id: 1,
      model: "GPT-4o",
      credits: 150,
      timestamp: "2024-12-18 14:32",
      type: "文本生成",
      status: "completed"
    },
    {
      id: 2,
      model: "Claude 3.5",
      credits: 200,
      timestamp: "2024-12-18 13:45",
      type: "代码生成",
      status: "completed"
    },
    {
      id: 3,
      model: "DALL-E 3",
      credits: 500,
      timestamp: "2024-12-18 12:20",
      type: "图像生成",
      status: "completed"
    },
    {
      id: 4,
      model: "GPT-3.5",
      credits: 50,
      timestamp: "2024-12-18 11:15",
      type: "对话聊天",
      status: "completed"
    },
    {
      id: 5,
      model: "Midjourney",
      credits: 800,
      timestamp: "2024-12-18 10:30",
      type: "图像生成",
      status: "completed"
    },
    {
      id: 6,
      model: "GPT-4o",
      credits: 180,
      timestamp: "2024-12-18 09:45",
      type: "文档分析",
      status: "completed"
    },
    {
      id: 7,
      model: "Claude 3.5",
      credits: 220,
      timestamp: "2024-12-18 08:30",
      type: "代码调试",
      status: "completed"
    },
    {
      id: 8,
      model: "DALL-E 3",
      credits: 450,
      timestamp: "2024-12-17 22:10",
      type: "图像编辑",
      status: "completed"
    }
  ];

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

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #8b5cf6, #3b82f6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #a78bfa, #60a5fa);
        }
      `}</style>
      
      <div className="team-members-card">
        <div className="card-header">
          <h3 className="card-title">积分明细</h3>
          <div className="team-location">
            <span>共 {totalRecords} 条记录</span>
          </div>
          <button className="show-more-btn">查看全部 &gt;</button>
        </div>

        <div
          className="team-list custom-scrollbar"
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            paddingRight: "4px"
          }}
        >
        {creditDetails.map((detail) => (
          <div key={detail.id} className="team-member">
            <div className="member-info">
              <div
                className="model-badge"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: getModelColor(detail.model),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold",
                  flexShrink: 0
                }}
              >
                {detail.model.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ marginLeft: "12px", flex: 1 }}>
                <div className="member-name" style={{ fontWeight: 600, marginBottom: "4px" }}>
                  {detail.model}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  {detail.type} · {detail.timestamp}
                </div>
              </div>
            </div>

            <div className="member-stats" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span
                className="member-value"
                style={{
                  fontWeight: 600,
                  fontSize: "16px",
                  color: getModelColor(detail.model),
                  minWidth: "80px",
                  textAlign: "right"
                }}
              >
                -{detail.credits} 积分
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default TeamMembers;