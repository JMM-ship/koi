"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardContent from "@/components/dashboard/DashboardContent";
import ApiKeysContent from "@/components/dashboard/ApiKeysContent";
import PlansContent from "@/components/dashboard/PlansContent";
import ProfileContent from "@/components/dashboard/ProfileContent";
import ReferralContent from "@/components/dashboard/ReferralContent";
import dynamic from "next/dynamic";
const GuideContent = dynamic(() => import("@/components/dashboard/GuideContent"), { ssr: false });
import AdminDashboard from "@/components/dashboard/admin/AdminDashboard";
import AdminUserManagement from "@/components/dashboard/admin/AdminUserManagement";
import AdminCodeManagement from "@/components/dashboard/admin/AdminCodeManagement";
import { FiMenu } from "react-icons/fi";
import "@/public/assets/css/dashboard.css";
import WelcomeGuide from "@/components/dashboard/WelcomeGuide";
import OnboardingWizard from "@/components/dashboard/OnboardingWizard";
import { useSession } from "next-auth/react";

export default function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession()
  const [serverDone, setServerDone] = useState<boolean | null>(null)
  const [sessionShowPanel, setSessionShowPanel] = useState(false) // 本次会话内，用户点击 Dashboard 后显示正常面板
  const [syncTried, setSyncTried] = useState(false)

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

  // 获取服务端 Onboarding 状态（管理员豁免）
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if ((session?.user as any)?.role === 'admin') {
          setServerDone(true)
          return
        }
        const resp = await fetch('/api/onboarding/state')
        // 若请求失败（如会话尚未就绪返回401），默认按未完成处理，避免错误地展示面板
        if (!resp.ok) { setServerDone(false); return }
        const data = await resp.json()
        const done = !!(data?.data?.done)
        setServerDone(done)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [session])

  // Cookie 兜底（用户作用域）：仅当本地 onboard_done=1 且与当前登录用户匹配时，才即时显示面板/尝试同步
  useEffect(() => {
    try {
      const hasCookie = typeof document !== 'undefined' && document.cookie.split(';').some(c => c.trim().startsWith('onboard_done=1'))
      const currentUserId = (session?.user as any)?.id || (session?.user as any)?.uuid || null
      const storedUserId = typeof window !== 'undefined' ? window.localStorage.getItem('onboard.v1.userId') : null
      if (hasCookie && currentUserId && storedUserId && storedUserId === String(currentUserId)) {
        if (serverDone === false) {
          // 后台补发一次完成态（仅尝试一次，且仅限匹配当前用户）
          if (!syncTried) {
            setSyncTried(true)
            try {
              const ls = typeof window !== 'undefined' ? window.localStorage.getItem('onboard.v1.steps') : null
              const steps = ls ? JSON.parse(ls) : {}
              fetch('/api/onboarding/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ done: true, steps, firstSeenAt: localStorage.getItem('onboard.v1.firstSeenAt') })
              }).then(() => setServerDone(true)).catch(() => {})
            } catch {}
          }
        }
        // 本会话立即显示面板
        setSessionShowPanel(true)
      }
    } catch {}
  }, [serverDone, syncTried, session])

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (serverDone === false && !sessionShowPanel) {
          return (
            <div style={{ marginBottom: '12px' }}>
              <OnboardingWizard
                bonusPoints={Number(process.env.NEXT_PUBLIC_NEW_USER_BONUS_POINTS || 500)}
                demoVideos={{
                  claude: process.env.NEXT_PUBLIC_ONBOARDING_VIDEO_CLAUDE as any,
                  codex: process.env.NEXT_PUBLIC_ONBOARDING_VIDEO_CODEX as any,
                }}
                onGotoApiKeys={() => setActiveTab('api-keys')}
                onGotoPlans={() => setActiveTab('plans')}
                onGotoProfile={() => setActiveTab('profile')}
                onDismiss={() => {
                  setServerDone(true)
                  setSessionShowPanel(true)
                }}
              />
            </div>
          )
        }
        return <DashboardContent onNavigateToPlans={() => setActiveTab('plans')} onNavigateToApiKeys={() => setActiveTab('api-keys')} hideNoUsageCallout={true} />;
      case 'guide':
        return <GuideContent onNavigateToApiKeys={() => setActiveTab('api-keys')} />;
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
        return <DashboardContent hideNoUsageCallout={true} />;
    }
  };

  return (
    <div className="dashboard-container">
      {!mounted ? (
        <div style={{ padding: 24, width: '100%' }}>
          <div style={{ height: 14, width: 180, background: '#111', borderRadius: 6, marginBottom: 12 }} />
          <div style={{ height: 10, width: 280, background: '#0d0d0d', borderRadius: 6, marginBottom: 24 }} />
          <div style={{ height: 120, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12 }} />
        </div>
      ) : (
        <>
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
            onTabChange={(tab) => {
              if (tab === 'dashboard' && serverDone === false) {
                setSessionShowPanel(true) // 本会话显示正常面板
              }
              setActiveTab(tab)
            }}
            isMobileMenuOpen={isMobileMenuOpen}
            onMobileMenuClose={() => setIsMobileMenuOpen(false)}
          />

          <div className={`dashboard-main ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
            <div className="dashboard-content">
              {serverDone === null ? (
                <div style={{ padding: 24, width: '100%' }}>
                  <div style={{ height: 14, width: 180, background: '#111', borderRadius: 6, marginBottom: 12 }} />
                  <div style={{ height: 10, width: 280, background: '#0d0d0d', borderRadius: 6, marginBottom: 24 }} />
                  <div style={{ height: 120, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12 }} />
                </div>
              ) : (
                renderContent()
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
