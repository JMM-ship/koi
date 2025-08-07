"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FiGrid, 
  FiFolder, 
  FiCalendar, 
  FiFileText, 
  FiShoppingBag,
  FiSettings,
  FiUser,
  FiSlack,
  FiGitlab
} from "react-icons/fi";

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { id: 1, icon: FiGrid, label: "Dashboard", path: "/dashboard", active: true },
    { id: 2, icon: FiFolder, label: "Projects", path: "/dashboard/projects", hasNotification: true },
    { id: 3, icon: FiCalendar, label: "Calendar", path: "/dashboard/calendar" },
    { id: 4, icon: FiFileText, label: "Documents", path: "/dashboard/documents", hasDropdown: true },
    { id: 5, icon: FiShoppingBag, label: "Store", path: "/dashboard/store" },
  ];

  const integrations = [
    { id: 1, icon: FiGitlab, label: "Figma", path: "/dashboard/figma" },
    { id: 2, icon: FiSlack, label: "Slack", path: "/dashboard/slack", hasNotification: true, notificationCount: 99 },
    { id: 3, icon: "🎮", label: "Jira", path: "/dashboard/jira", isEmoji: true },
  ];

  const accountItems = [
    { id: 1, icon: FiSettings, label: "Settings", path: "/dashboard/settings", hasDropdown: true },
    { id: 2, icon: FiSettings, label: "Settings", path: "/dashboard/settings2" },
  ];

  return (
    <div className="dashboard-sidebar">
      <div className="sidebar-header">
        <div className="logo-wrapper">
          <span className="logo-icon">📊</span>
          <span className="logo-text">Dashcube</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.id} className={`nav-item ${item.active ? "active" : ""}`}>
              <Link href={item.path} className="nav-link">
                <item.icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {item.hasNotification && <span className="notification-dot"></span>}
                {item.hasDropdown && <span className="dropdown-arrow">▼</span>}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-section">
          <div className="section-title">INTEGRATIONS</div>
          <ul className="nav-list">
            {integrations.map((item) => (
              <li key={item.id} className="nav-item">
                <Link href={item.path} className="nav-link">
                  {item.isEmoji ? (
                    <span className="nav-icon emoji">{item.icon}</span>
                  ) : (
                    <item.icon className="nav-icon" />
                  )}
                  <span className="nav-label">{item.label}</span>
                  {item.hasNotification && (
                    <span className="notification-badge">{item.notificationCount}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="nav-section">
          <div className="section-title">ACCOUNT</div>
          <ul className="nav-list">
            {accountItems.map((item) => (
              <li key={item.id} className="nav-item">
                <Link href={item.path} className="nav-link">
                  <item.icon className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                  {item.hasDropdown && <span className="dropdown-arrow">▼</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <img 
            src="/assets/img/team/team-1.jpg" 
            alt="User" 
            className="user-avatar"
          />
          <div className="user-info">
            <div className="user-name">Adam Simpson</div>
          </div>
          <button className="more-btn">⋯</button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;