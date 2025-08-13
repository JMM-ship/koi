"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FiGrid,
  FiFolder,
  FiCalendar,
  FiFileText,
  FiShoppingBag,
  FiSettings,
  FiUser,
  FiUsers,
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
  FiLogOut,
  FiKey
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
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapsedChange, activeTab = 'dashboard', onTabChange }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTooltip, setShowTooltip] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // 检查是否为管理员
  const isAdmin = session?.user?.role === 'admin';

  const menuItems: MenuItem[] = [
    { id: 1, icon: FiGrid, label: "Dashboard", path: "dashboard", active: activeTab === "dashboard" },
    { id: 2, icon: FiUser, label: "My Subscription", path: "subscription", active: activeTab === "subscription" },
    { id: 3, icon: FiSlack, label: "API Keys", path: "api-keys", active: activeTab === "api-keys" },
    { id: 4, icon: FiShoppingBag, label: "Purchase Plans", path: "plans", active: activeTab === "plans" },
  ];
  
  // 管理员菜单项
  const adminItems: MenuItem[] = isAdmin ? [
    { id: 10, icon: FiShield, label: "Admin Panel", path: "admin", active: activeTab === "admin" },
    { id: 11, icon: FiUsers, label: "User Management", path: "admin-users", active: activeTab === "admin-users" },
    { id: 12, icon: FiKey, label: "Code Management", path: "admin-codes", active: activeTab === "admin-codes" },
  ] : [];

  const accountItems: MenuItem[] = [
    { id: 2, icon: FiUser, label: "Profile", path: "profile", active: activeTab === "profile" },
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
    if (isLoggingOut) return;

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
    <>
      {/* 添加旋转动画的样式 */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin 1s linear infinite;
        }
        
        /* 覆盖 dashboard.css 的固定宽度 */
        .dashboard-sidebar {
          width: ${isCollapsed ? '80px' : '260px'} !important;
          transition: width 0.3s ease !important;
        }
        
        /* 收缩时隐藏文字 */
        ${isCollapsed ? `
          .dashboard-sidebar .nav-label,
          .dashboard-sidebar .section-title,
          .dashboard-sidebar .user-info,
          .dashboard-sidebar .logout-btn,
          .dashboard-sidebar .dropdown-arrow {
            display: none !important;
          }
          
          .dashboard-sidebar .nav-link {
            justify-content: center !important;
          }
          
          .dashboard-sidebar .nav-icon {
            margin-right: 0 !important;
          }
        ` : ''}
      `}</style>

      <div
        className="dashboard-sidebar transition-all duration-300"
        style={{ width: isCollapsed ? '80px' : '260px' }}
      >
        <div className="sidebar-header relative">
          <div className="logo-wrapper">
            <Link className="navbar-brand" href="/">
              <div style={{ overflow: 'hidden', width: '180px', height: '100px' }}>
                <Image src="/assets/logo.svg" alt="KOI" width={180} height={100} style={{ objectFit: 'cover', objectPosition: 'left center', transform: 'scale(1.2)' }} />
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
              transition: 'all 0.3s ease',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.transform = 'scale(1)';
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
                className={`nav-item relative ${item.active ? "active" : ""}`}
                onMouseEnter={() => isCollapsed && setShowTooltip(item.id)}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <div
                  onClick={() => onTabChange?.(item.path!)}
                  className="nav-link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    cursor: 'pointer'
                  }}
                >
                  <item.icon className="nav-icon" style={{ marginRight: isCollapsed ? '0' : undefined }} />
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                  {item.hasNotification && <span className="notification-dot"></span>}
                  {item.hasDropdown && !isCollapsed && <span className="dropdown-arrow">▼</span>}
                </div>

                {/* Tooltip */}
                {isCollapsed && showTooltip === item.id && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-r-[5px] border-r-gray-800 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent"></div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* 管理员菜单部分 */}
          {adminItems.length > 0 && (
            <div className="nav-section">
              {!isCollapsed && <div className="section-title">ADMIN</div>}
              <ul className="nav-list">
                {adminItems.map((item) => (
                  <li
                    key={item.id}
                    className={`nav-item relative ${item.active ? "active" : ""}`}
                    onMouseEnter={() => isCollapsed && setShowTooltip(item.id)}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    <div
                      onClick={() => onTabChange?.(item.path!)}
                      className="nav-link"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        cursor: 'pointer'
                      }}
                    >
                      <item.icon className="nav-icon" style={{ marginRight: isCollapsed ? '0' : undefined }} />
                      {!isCollapsed && <span className="nav-label">{item.label}</span>}
                    </div>

                    {/* Tooltip */}
                    {isCollapsed && showTooltip === item.id && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50">
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-r-[5px] border-r-gray-800 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent"></div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="nav-section">
            {!isCollapsed && <div className="section-title">ACCOUNT</div>}
            <ul className="nav-list">
              {accountItems.map((item) => (
                <li key={item.id}>
                  <div
                    className={`nav-item relative ${item.active ? "active" : ""}`}
                    onMouseEnter={() => isCollapsed && setShowTooltip(item.id + 100)}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    {item.hasDropdown ? (
                      <div
                        className="nav-link cursor-pointer"
                        onClick={() => !isCollapsed && toggleDropdown(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isCollapsed ? 'center' : 'flex-start'
                        }}
                      >
                        <item.icon className="nav-icon" style={{ marginRight: isCollapsed ? '0' : undefined }} />
                        {!isCollapsed && <span className="nav-label">{item.label}</span>}
                        {item.hasDropdown && !isCollapsed && (
                          <span className="dropdown-arrow ml-auto flex items-center">
                            {expandedItems.includes(item.id) ? <FiChevronUp /> : <FiChevronDown />}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => onTabChange?.(item.path!)}
                        className="nav-link"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isCollapsed ? 'center' : 'flex-start',
                          cursor: 'pointer'
                        }}
                      >
                        <item.icon className="nav-icon" style={{ marginRight: isCollapsed ? '0' : undefined }} />
                        {!isCollapsed && <span className="nav-label">{item.label}</span>}
                      </div>
                    )}

                    {/* Tooltip */}
                    {isCollapsed && showTooltip === item.id + 100 && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50">
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-r-[5px] border-r-gray-800 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent"></div>
                      </div>
                    )}
                  </div>

                  {/* Submenu */}
                  {item.subItems && !isCollapsed && expandedItems.includes(item.id) && (
                    <ul className="list-none p-0 m-0 overflow-hidden transition-all duration-300 max-h-52">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.id} className="sub-menu-item">
                          <Link
                            href={subItem.path!}
                            className={`flex items-center py-2 px-5 pl-12 text-sm transition-all duration-300 hover:bg-gray-100 ${pathname === subItem.path ? 'text-blue-500' : 'text-gray-600'
                              } hover:text-blue-500`}
                          >
                            <subItem.icon className="text-base mr-2" />
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
          <div className="user-profile" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}>
            <Image
              src="/assets/img/team/team-1.jpg"
              alt="User"
              className="user-avatar rounded-full object-cover"
              width={40}
              height={40}
            />
            {!isCollapsed && (
              <>
                <div className="user-info" style={{ marginLeft: '12px' }}>
                  <div className="user-name" style={{ fontSize: '14px', fontWeight: '500' }}>Adam Simpson</div>
                </div>
                <button
                  className="logout-btn"
                  style={{
                    marginLeft: 'auto',
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
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title="退出登录"
                  onMouseEnter={(e) => !isLoggingOut && (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <FiLogOut className={isLoggingOut ? 'animate-spin-slow' : ''} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;