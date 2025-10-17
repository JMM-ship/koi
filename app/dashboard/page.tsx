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
import WelcomeGuide from "@/components/dashboard/WelcomeGuide";
import { useSearchParams } from "next/navigation";

export default function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sp = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 标记已挂载，避免 SSR/客户端初始不一致导致 hydration 报错
  useEffect(() => {
    setMounted(true);
  }, []);

  // 决定是否展示欢迎引导
  useEffect(() => {
    try {
      const done = window.localStorage.getItem('onboard.v1.done') === '1'
      if (done) { setShowWelcome(false); return }
      const welcomeParam = sp.get('welcome')
      if (welcomeParam === '1' || welcomeParam === 'true') { setShowWelcome(true); return }
      // 7天可见窗口
      const fs = window.localStorage.getItem('onboard.v1.firstSeenAt')
      const now = Date.now()
      if (!fs) {
        window.localStorage.setItem('onboard.v1.firstSeenAt', new Date(now).toISOString())
        setShowWelcome(true)
        return
      }
      const ts = Date.parse(fs)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      setShowWelcome(now - ts <= sevenDays)
    } catch {
      setShowWelcome(false)
    }
  }, [sp])

  // 与服务端状态同步（跨设备一致）
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const resp = await fetch('/api/onboarding/state')
        if (!resp.ok) return
        const data = await resp.json()
        if (cancelled) return
        const s = data?.data || {}
        if (s.done) {
          try { window.localStorage.setItem('onboard.v1.done', '1') } catch {}
          setShowWelcome(false)
        } else if (s.firstSeenAt) {
          try { window.localStorage.setItem('onboard.v1.firstSeenAt', s.firstSeenAt) } catch {}
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent onNavigateToPlans={() => setActiveTab('plans')} onNavigateToApiKeys={() => setActiveTab('api-keys')} hideNoUsageCallout={showWelcome} />;
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
      {/* 欢迎引导卡片 */}
      {mounted && showWelcome && (
        <div style={{ position: 'relative', zIndex: 1, margin: '12px 12px 0 12px' }} suppressHydrationWarning>
          <WelcomeGuide
            bonusPoints={Number(process.env.NEXT_PUBLIC_NEW_USER_BONUS_POINTS || 0)}
            onGotoApiKeys={() => setActiveTab('api-keys')}
            onGotoPlans={() => setActiveTab('plans')}
            onGotoSetLocale={() => setActiveTab('profile')}
            onGotoProfile={() => setActiveTab('profile')}
            onDismiss={() => setShowWelcome(false)}
          />
        </div>
      )}
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
