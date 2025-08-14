"use client";

const TeamMembers = () => {
  const creditDetails = [
    {
      id: 1,
      model: "GPT-4o",
      credits: 150,
      timestamp: "2024-12-18 14:32",
      type: "Text Generation",
      status: "completed"
    },
    {
      id: 2,
      model: "Claude 3.5",
      credits: 200,
      timestamp: "2024-12-18 13:45",
      type: "Code Generation",
      status: "completed"
    },
    {
      id: 3,
      model: "DALL-E 3",
      credits: 500,
      timestamp: "2024-12-18 12:20",
      type: "Image Generation",
      status: "completed"
    },
    {
      id: 4,
      model: "GPT-3.5",
      credits: 50,
      timestamp: "2024-12-18 11:15",
      type: "Chat Conversation",
      status: "completed"
    },
    {
      id: 5,
      model: "Midjourney",
      credits: 800,
      timestamp: "2024-12-18 10:30",
      type: "Image Generation",
      status: "completed"
    },
    {
      id: 6,
      model: "GPT-4o",
      credits: 180,
      timestamp: "2024-12-18 09:45",
      type: "Document Analysis",
      status: "completed"
    },
    {
      id: 7,
      model: "Claude 3.5",
      credits: 220,
      timestamp: "2024-12-18 08:30",
      type: "Code Debugging",
      status: "completed"
    },
    {
      id: 8,
      model: "DALL-E 3",
      credits: 450,
      timestamp: "2024-12-17 22:10",
      type: "Image Editing",
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