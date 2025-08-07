"use client";

const TeamMembers = () => {
  const teamMembers = [
    {
      id: 1,
      name: "Silvester Ananag",
      avatar: "/assets/img/team/team-1.jpg",
      progress: 65,
      value: "350",
      color: "#00d084"
    },
    {
      id: 2,
      name: "Amanda Rouge",
      avatar: "/assets/img/team/team-2.jpg",
      progress: 55,
      value: "411",
      color: "#ffa500"
    },
    {
      id: 3,
      name: "Adam Dinner",
      avatar: "/assets/img/team/team-3.jpg",
      progress: 41,
      value: "25",
      color: "#ff006e"
    },
    {
      id: 4,
      name: "Isabella Bean",
      avatar: "/assets/img/team/team-4.jpg",
      progress: 59,
      value: "9",
      color: "#00b4d8"
    },
    {
      id: 5,
      name: "Robby Adams",
      avatar: "/assets/img/team/team-5.jpg",
      progress: 62,
      value: "63",
      color: "#00d084"
    }
  ];

  return (
    <div className="team-members-card">
      <div className="card-header">
        <h3 className="card-title">Team</h3>
        <div className="team-location">
          <span className="location-icon">📍</span>
          <span>Sales New York</span>
        </div>
        <button className="show-more-btn">SHOW MORE &gt;</button>
      </div>

      <div className="team-list">
        {teamMembers.map((member) => (
          <div key={member.id} className="team-member">
            <div className="member-info">
              <img 
                src={member.avatar} 
                alt={member.name}
                className="member-avatar"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${member.name}&background=random`;
                }}
              />
              <span className="member-name">{member.name}</span>
            </div>
            
            <div className="member-stats">
              <div className="progress-bar-wrapper">
                <div 
                  className="progress-bar"
                  style={{
                    width: `${member.progress}%`,
                    backgroundColor: member.color
                  }}
                ></div>
              </div>
              <span className="member-percentage">{member.progress}%</span>
              <span className="member-value">{member.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamMembers;