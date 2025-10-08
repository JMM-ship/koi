"use client";

import useSWR from 'swr'

interface CreditDetail {
  id: string
  model: string
  credits: number
  timestamp: string
  type: string
  status: string
}

const TeamMembers = () => {
  const { data: creditDetails } = useSWR<CreditDetail[]>('/api/dashboard/model-usage?limit=10', async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch model usage')
    const result = await response.json()
    const formatted: CreditDetail[] = (result?.data || []).map((item: any) => ({
      id: item.id,
      model: item.modelName,
      credits: item.allTokens,
      timestamp: new Date(item.timestamp).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }),
      type: item.usageType,
      status: item.status,
    }))
    return formatted
  })
  const loading = !creditDetails

  const getModelColor = (model: string) => {
    const colors: { [key: string]: string } = {
      "claude-sonnet-4-5-20250929": "#00d084",
      "GPT-3.5": "#00b4d8",
      "claude-3-5-haiku-20241022": "#ffa500",
      "DALL-E 3": "#ff006e",
      "Midjourney": "#8b5cf6"
    };
    return colors[model] || "#6b7280";
  };

  const totalRecords = (creditDetails || []).length;
  console.log('creditDetails', creditDetails);

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
        {(creditDetails || []).length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem 1rem",
              color: "#6b7280"
            }}
          >
            <div style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              No credit usage yet
            </div>
            <div style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
              You haven’t used any credits yet — try unlocking premium features now!
            </div>
            <button
              style={{
                backgroundColor: "#4f46e5",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontWeight: 600
              }}
              onClick={() => {
                // Navigate to credits usage page or feature
              }}
            >
              Use Credits Now
            </button>
          </div>
        ) : (
          (creditDetails || []).slice(0, 5).map((detail: CreditDetail) => (
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
                  {detail?.model?.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ marginLeft: "0.75rem", flex: 1 }}>
                  <div
                    className="member-name"
                    style={{ fontWeight: 600, marginBottom: "0.25rem" }}
                  >
                    {detail?.model}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    {detail?.type} · {detail?.timestamp}
                  </div>
                </div>
              </div>

              <div
                className="member-stats"
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
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
                  -{detail?.credits} Credits
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamMembers;
