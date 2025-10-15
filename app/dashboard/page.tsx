"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardContent from "@/components/dashboard/DashboardContent";
import ApiKeysContent from "@/components/dashboard/ApiKeysContent";
import PlansContent from "@/components/dashboard/PlansContent";
import ProfileContent from "@/components/dashboard/ProfileContent";
import ReferralContent from "@/components/dashboard/ReferralContent";
import AdminDashboard from "@/components/dashboard/admin/AdminDashboard";
import AdminUserManagement from "@/components/dashboard/admin/AdminUserManagement";
import AdminCodeManagement from "@/components/dashboard/admin/AdminCodeManagement";
import { FiMenu } from "react-icons/fi";
import "@/public/assets/css/dashboard.css";

export default function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent onNavigateToPlans={() => setActiveTab('plans')} />;
      case 'api-keys':
        return <ApiKeysContent />;
      case 'plans':
        return <PlansContent />;
      case 'profile':
        return <ProfileContent />;
      case 'referral':
        return <ReferralContent />;
      // 管理员页面
      case 'admin':
        return <AdminDashboard />;
      case 'admin-users':
        return <AdminUserManagement />;
      case 'admin-codes':
        return <AdminCodeManagement />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* 移动端菜单按钮 */}
      {isMobile && (
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(true)}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 998,
            background: 'var(--dashboard-card-bg)',
            border: '1px solid var(--dashboard-border)',
            borderRadius: '8px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--dashboard-text)',
            fontSize: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          <FiMenu />
        </button>
      )}

      <Sidebar
        onCollapsedChange={setIsSidebarCollapsed}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      <div className={`dashboard-main ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
