"use client";

import Image from "next/image";
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
    { id: 2, icon: FiUser, label: "My Subscription", path: "/dashboard/subscription" },
    { id: 3, icon: FiSlack, label: "API Keys", path: "/dashboard/api-keys" },
    { id: 4, icon: FiShoppingBag, label: "Purchase Plans", path: "/dashboard/plans" },
  ];

  const accountItems = [
    { id: 1, icon: FiSettings, label: "Settings", path: "/dashboard/settings", hasDropdown: true },
    { id: 2, icon: FiUser, label: "Profile", path: "/dashboard/profile" },
  ];

  return (
    <div className="dashboard-sidebar">
      <div className="sidebar-header">
        <div className="logo-wrapper">
          <Link className="navbar-brand dashborad-logo" href="/">
            <div style={{ overflow: 'hidden', width: '170px', height: '80px' }}>
              <Image src="/assets/logo.svg" alt="KOI" width={160} height={120} style={{ objectFit: 'cover', objectPosition: 'left center', transform: 'scale(1.2)' }} />
            </div>
          </Link>
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