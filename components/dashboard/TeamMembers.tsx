"use client";

import useSWR from 'swr'

interface CreditDetail {
  id: string
  model: string
  credits: number
  timestamp: string
  type: string
  status: string
  bucket?: string
}

interface CreditDetailsResponse {
  items: CreditDetail[]
  total: number
}

const TeamMembers = () => {
  const { data: creditDetails } = useSWR<CreditDetailsResponse>('/api/dashboard/model-usage?limit=10', async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch model usage')
    const result = await response.json()
    const formatted: CreditDetail[] = (result?.data || []).map((item: any) => {
      const meta = (item?.metadata || {}) as Record<string, any>
      const displayName = typeof item?.reason === 'string' && item.reason.trim().length > 0
        ? item.reason
        : typeof item?.modelName === 'string' && item.modelName.trim().length > 0
        ? item.modelName
        : typeof meta?.service === 'string' && meta.service.trim().length > 0
        ? meta.service
        : 'Credits Usage'

      const timeValue = item?.timestamp ? new Date(item.timestamp) : null
      const timestamp = timeValue && !isNaN(timeValue.getTime())
        ? timeValue.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '-'

      const credits = Number(item?.credits ?? item?.points ?? 0)
      const bucket = typeof item?.bucket === 'string' ? item.bucket : (typeof item?.usageType === 'string' ? item.usageType : undefined)
      const type = typeof item?.usageType === 'string' ? item.usageType : (bucket ?? 'usage')

      return {
        id: item?.id,
        model: displayName,
        credits,
        timestamp,
        type,
        status: item?.status || 'completed',
        bucket,
      }
    })

    return {
      items: formatted,
      total: typeof result?.total === 'number' ? result.total : formatted.length,
    }
  })
  const loading = !creditDetails

  const getModelColor = (detail: CreditDetail) => {
    if (detail.bucket === 'package') return '#4f46e5'
    if (detail.bucket === 'independent') return '#10b981'
    const colors: { [key: string]: string } = {
      "GPT-4o": "#00d084",
      "GPT-3.5": "#00b4d8",
      "Claude 3.5": "#ffa500",
      "DALL-E 3": "#ff006e",
      "Midjourney": "#8b5cf6"
    };
    return colors[detail.model] || "#6b7280";
  };

  const details = creditDetails?.items || []
  const totalRecords = creditDetails?.total || details.length;

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
        {details.length === 0 ? (
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
          details.slice(0, 5).map((detail: CreditDetail) => (
            <div key={detail.id} className="team-member">
              <div className="member-info">
                <div
                  className="model-badge"
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "0.5rem",
                    backgroundColor: getModelColor(detail),
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
                  <div
                    className="member-name"
                    style={{ fontWeight: 600, marginBottom: "0.25rem" }}
                  >
                    {detail.model}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    {detail.type} · {detail.timestamp}
                  </div>
                </div>
              </div>

              <div
                className="member-stats"
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                {detail.bucket && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      textTransform: 'capitalize'
                    }}
                  >
                    {detail.bucket}
                  </span>
                )}
                <span
                  className="member-value"
                  style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: getModelColor(detail),
                    minWidth: "5rem",
                    textAlign: "right"
                  }}
                >
                  -{detail.credits} Credits
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
