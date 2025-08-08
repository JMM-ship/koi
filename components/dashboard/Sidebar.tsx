"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiGrid,
  FiFolder,
  FiCalendar,
  FiFileText,
  FiShoppingBag,
  FiSettings,
  FiUser,
  FiSlack,
  FiGitlab,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiMenu,
  FiBell,
  FiLock,
  FiShield,
  FiLogOut
} from "react-icons/fi";

interface MenuItem {
  id: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  path?: string;
  active?: boolean;
  hasNotification?: boolean;
  hasDropdown?: boolean;
  subItems?: MenuItem[];
}

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapsedChange }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTooltip, setShowTooltip] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems: MenuItem[] = [
    { id: 1, icon: FiGrid, label: "Dashboard", path: "/dashboard", active: pathname === "/dashboard" },
    { id: 2, icon: FiUser, label: "My Subscription", path: "/dashboard/subscription", active: pathname === "/dashboard/subscription" },
    { id: 3, icon: FiSlack, label: "API Keys", path: "/dashboard/api-keys", active: pathname === "/dashboard/api-keys" },
    { id: 4, icon: FiShoppingBag, label: "Purchase Plans", path: "/dashboard/plans", active: pathname === "/dashboard/plans" },
  ];

  const accountItems: MenuItem[] = [
    { id: 2, icon: FiUser, label: "Profile", path: "/dashboard/profile", active: pathname === "/dashboard/profile" },
  ];

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (newCollapsed) {
      setExpandedItems([]);
    }
    onCollapsedChange?.(newCollapsed);
  };

  const toggleDropdown = (itemId: number) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // 防止重复点击

    // 显示确认对话框
    const confirmed = window.confirm('确定要退出登录吗？');
    if (!confirmed) return;

    setIsLoggingOut(true);

    try {
      // 1. 调用退出 API（如果有的话）
      // await fetch('/api/auth/logout', { 
      //   method: 'POST',
      //   credentials: 'include'
      // });

      // 2. 清除本地存储的用户信息
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('refreshToken');

      // 3. 清除会话存储
      sessionStorage.clear();

      // 4. 清除所有 cookies（如果需要）
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // 5. 显示退出成功提示
      console.log('退出登录成功');

      // 6. 重定向到登录页面
      router.push('/auth/signin');

    } catch (error) {
      console.error('退出登录失败:', error);
      alert('退出登录失败，请重试');
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-wrapper">
          <Link className="navbar-brand dashborad-logo" href="/">
            <div style={{
              overflow: 'hidden',
              width: isCollapsed ? '40px' : '170px',
              height: '80px',
              transition: 'width 0.3s ease'
            }}>
              <Image
                src="/assets/logo.svg"
                alt="KOI"
                width={160}
                height={120}
                style={{
                  objectFit: 'cover',
                  objectPosition: 'left center',
                  transform: isCollapsed ? 'scale(0.8)' : 'scale(1.2)',
                  transition: 'transform 0.3s ease'
                }}
              />
            </div>
          </Link>
        </div>
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          style={{
            position: 'absolute',
            right: isCollapsed ? '-15px' : '10px',
            top: '30px',
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'right 0.3s ease',
            zIndex: 10
          }}
        >
          {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li
              key={item.id}
              className={`nav-item ${item.active ? "active" : ""}`}
              onMouseEnter={() => isCollapsed && setShowTooltip(item.id)}
              onMouseLeave={() => setShowTooltip(null)}
              style={{ position: 'relative' }}
            >
              <Link href={item.path!} className="nav-link">
                <item.icon className="nav-icon" />
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
                {item.hasNotification && <span className="notification-dot"></span>}
                {item.hasDropdown && !isCollapsed && <span className="dropdown-arrow">▼</span>}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-section">
          {!isCollapsed && <div className="section-title">ACCOUNT</div>}
          <ul className="nav-list">
            {accountItems.map((item) => (
              <li key={item.id}>
                <div
                  className={`nav-item ${item.active ? "active" : ""}`}
                  onMouseEnter={() => isCollapsed && setShowTooltip(item.id + 100)}
                  onMouseLeave={() => setShowTooltip(null)}
                  style={{ position: 'relative' }}
                >
                  {item.hasDropdown ? (
                    <div
                      className="nav-link"
                      onClick={() => !isCollapsed && toggleDropdown(item.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <item.icon className="nav-icon" />
                      {!isCollapsed && <span className="nav-label">{item.label}</span>}
                      {item.hasDropdown && !isCollapsed && (
                        <span className="dropdown-arrow">
                          {expandedItems.includes(item.id) ? <FiChevronUp /> : <FiChevronDown />}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Link href={item.path!} className="nav-link">
                      <item.icon className="nav-icon" />
                      {!isCollapsed && <span className="nav-label">{item.label}</span>}
                    </Link>
                  )}
                  {isCollapsed && showTooltip === item.id + 100 && (
                    <div className="sidebar-tooltip" style={{
                      position: 'absolute',
                      left: '100%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      marginLeft: '10px',
                      background: '#333',
                      color: '#fff',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      fontSize: '12px',
                      zIndex: 1000
                    }}>
                      {item.label}
                      <div style={{
                        position: 'absolute',
                        right: '100%',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        borderRight: '5px solid #333',
                        borderTop: '5px solid transparent',
                        borderBottom: '5px solid transparent'
                      }}></div>
                    </div>
                  )}
                </div>
                {item.subItems && !isCollapsed && expandedItems.includes(item.id) && (
                  <ul className="sub-menu" style={{
                    listStyle: 'none',
                    padding: '0',
                    margin: '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease',
                    maxHeight: expandedItems.includes(item.id) ? '200px' : '0'
                  }}>
                    {item.subItems.map((subItem) => (
                      <li key={subItem.id} className="sub-menu-item">
                        <Link
                          href={subItem.path!}
                          className="sub-nav-link"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 20px 8px 50px',
                            color: pathname === subItem.path ? '#007bff' : '#666',
                            textDecoration: 'none',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <subItem.icon className="nav-icon" style={{ fontSize: '16px', marginRight: '10px' }} />
                          <span>{subItem.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className={`user-profile ${isCollapsed ? 'collapsed' : ''}`}>
          <Image
            src="/assets/img/team/team-1.jpg"
            alt="User"
            className="user-avatar"
            width={40}
            height={40}
            style={{
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
          {!isCollapsed && (
            <>
              <div className="user-info">
                <div className="user-name">Adam Simpson</div>
              </div>
              <button
                className="logout-btn"
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="退出登录"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isLoggingOut ? '#999' : '#dc3545',
                  fontSize: '18px',
                  cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  opacity: isLoggingOut ? 0.6 : 1,
                }}
                onMouseEnter={(e) => !isLoggingOut && (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <FiLogOut style={{
                  animation: isLoggingOut ? 'spin 1s linear infinite' : 'none'
                }} />
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .dashboard-sidebar {
          transition: width 0.3s ease;
          width: 260px;
        }
        
        .dashboard-sidebar.collapsed {
          width: 80px;
        }
        
        .dashboard-sidebar.collapsed .nav-label,
        .dashboard-sidebar.collapsed .section-title,
        .dashboard-sidebar.collapsed .user-info,
        .dashboard-sidebar.collapsed .logout-btn {
          display: none;
        }
        
        .dashboard-sidebar.collapsed .nav-link {
          justify-content: center;
        }
        
        .dashboard-sidebar.collapsed .nav-icon {
          margin-right: 0;
        }
        
        .dashboard-sidebar.collapsed .user-profile {
          justify-content: center;
        }
        
        .nav-link {
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
        }
        
        .nav-icon {
          transition: margin 0.3s ease;
        }
        
        .dropdown-arrow {
          margin-left: auto;
          display: flex;
          align-items: center;
        }
        
        .sub-nav-link:hover {
          background-color: #f5f5f5;
          color: #007bff !important;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;