"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  FiKey,
  FiHelpCircle
} from "react-icons/fi";
import { useConfirm } from "@/hooks/useConfirm";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from '@/hooks/useToast'
import { useT } from '@/contexts/I18nContext'
import SupportContactModal from '@/components/common/SupportContactModal'

interface MenuItem {
  id: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  path?: string;
  active?: boolean;
  hasNotification?: boolean;
  hasDropdown?: boolean;
  subItems?: MenuItem[];
  onClick?: () => void;
}

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isMobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onCollapsedChange,
  activeTab = 'dashboard',
  onTabChange,
  isMobileMenuOpen = false,
  onMobileMenuClose
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTooltip, setShowTooltip] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { confirmState, showConfirm } = useConfirm();
  const { showError } = useToast()
  const { t } = useT()
  // 检查是否为管理员
  const isAdmin = session?.user?.role === 'admin';

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 处理侧边栏动画状态
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsAnimating(true);
    } else {
      // 延迟卸载，等待退出动画完成
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // 与 CSS transition 时间一致
      return () => clearTimeout(timer);
    }
  }, [isMobileMenuOpen]);


  const menuItems: MenuItem[] = [
    { id: 1, icon: FiGrid, label: t('sidebar.dashboard'), path: "dashboard", active: activeTab === "dashboard" },
    { id: 3, icon: FiSlack, label: t('sidebar.apiKeys'), path: "api-keys", active: activeTab === "api-keys" },
    { id: 4, icon: FiShoppingBag, label: t('sidebar.purchasePlans'), path: "plans", active: activeTab === "plans" },
    { id: 5, icon: FiUsers, label: t('sidebar.referralProgram'), path: "referral", active: activeTab === "referral" },
    { id: 6, icon: FiHelpCircle, label: t('sidebar.support') || 'Support', onClick: () => setSupportOpen(true) },
  ];

  // 管理员菜单项
  const adminItems: MenuItem[] = isAdmin ? [
    { id: 10, icon: FiShield, label: t('sidebar.adminPanel'), path: "admin", active: activeTab === "admin" },
    { id: 11, icon: FiUsers, label: t('sidebar.userManagement'), path: "admin-users", active: activeTab === "admin-users" },
    { id: 12, icon: FiKey, label: t('sidebar.codeManagement'), path: "admin-codes", active: activeTab === "admin-codes" },
  ] : [];

  const accountItems: MenuItem[] = [
    { id: 2, icon: FiUser, label: t('sidebar.profile'), path: "profile", active: activeTab === "profile" },
  ];

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (newCollapsed) {
      setExpandedItems([]);
    }
    onCollapsedChange?.(newCollapsed);
  };

  const [supportOpen, setSupportOpen] = useState(false)

  // 处理移动端菜单项点击
  const handleMenuItemClick = (path: string) => {
    onTabChange?.(path);
    // 移动端点击菜单项后自动关闭侧边栏
    if (isMobile) {
      onMobileMenuClose?.();
    }
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

    setIsLoggingOut(true);

    try {
      // 清除本地存储的用户信息
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('refreshToken');

      // 清除会话存储
      sessionStorage.clear();

      // 使用 NextAuth 的 signOut 方法，直接重定向
      await signOut({
        redirect: true,
        callbackUrl: '/auth/signin'
      });

    } catch (error) {
      showError(t('toasts.logoutFailedRetry') || 'Logout failed, please retry')
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* 移动端遮罩层 */}
      {isMobile && isAnimating && (
        <div
          className={`mobile-overlay ${!isMobileMenuOpen ? 'closing' : ''}`}
          onClick={onMobileMenuClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            opacity: isMobileMenuOpen ? 1 : 0,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      )}

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
        className={`dashboard-sidebar ${isMobile && isAnimating ? (isMobileMenuOpen ? 'mobile-open' : 'mobile-closing') : ''}`}
        style={{
          width: isCollapsed ? '80px' : '260px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
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
                  onClick={() => item.onClick ? item.onClick() : handleMenuItemClick(item.path!)}
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
                      onClick={() => handleMenuItemClick(item.path!)}
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
                        onClick={() => handleMenuItemClick(item.path!)}
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
            {session?.user?.avatarUrl && (
              <Image
                src={session?.user?.avatarUrl}
                alt="User"
                className="user-avatar rounded-full object-cover"
                width={40}
                height={40}
                unoptimized={session?.user?.avatarUrl as any && (session?.user?.avatarUrl.startsWith("http://") || session?.user?.avatarUrl.startsWith("https://"))}
              />
            )}
            {!isCollapsed && (
              <>
                <div className="user-info" style={{ marginLeft: '12px' }}>
                  <div className="user-name" style={{ fontSize: '14px', fontWeight: '500' }}>{session?.user?.nickname}</div>
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
                  onClick={() => showConfirm("sure want to logout", handleLogout)}
                  disabled={isLoggingOut}
                  title="logout"
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
      <ConfirmDialog {...confirmState} />
      <SupportContactModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} imageSrc="/support/WechatIMG853.jpg" />
    </>
  );
};

export default Sidebar;
