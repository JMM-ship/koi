"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import WorkSummaryChart from "@/components/dashboard/WorkSummaryChart";
import VisitsByLocation from "@/components/dashboard/VisitsByLocation";
import CreditCard from "@/components/dashboard/CreditCard";
import ExchangeBalance from "@/components/dashboard/ExchangeBalance";
import TeamMembers from "@/components/dashboard/TeamMembers";
import SatisfactionRate from "@/components/dashboard/SatisfactionRate";
import "@/public/assets/css/dashboard.css";

export default function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="dashboard-container" style={{
      height: '100vh',
      overflow: 'hidden'
    }}>
      <Sidebar onCollapsedChange={setIsSidebarCollapsed} />

      <div className="dashboard-main" style={{
        marginLeft: isSidebarCollapsed ? '80px' : '260px',
        width: isSidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 260px)',
        transition: 'all 0.3s ease',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* <TopBar /> */}

        <div className="dashboard-content" style={{
          flex: 1,
          padding: '20px',
          overflow: 'hidden'
        }}>
          <div className="dashboard-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 380px)',
            gap: '20px',
            height: '100%'
          }}>
            {/* 左侧主要内容区 */}
            <div className="main-content" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              overflow: 'hidden',
              minWidth: 0
            }}>
              {/* 工作总结图表 */}
              <div style={{
                flex: '0 0 auto',
                maxHeight: '45%',
                overflow: 'hidden'
              }}>
                <WorkSummaryChart />
              </div>

              <div className="main-bottom">
                {/* 余额卡片组 */}
                <div>
                  <ExchangeBalance />
                </div>

                {/* 团队成员列表 */}
                <div>
                  <TeamMembers />
                </div>
              </div>
            </div>

            {/* 右侧边栏内容 */}
            <div className="side-content" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              overflow: 'auto',
              minWidth: 0,
              paddingRight: '10px'
            }}>
              {/* 满意度 */}
              <div style={{ flex: '0 0 auto' }}>
                <SatisfactionRate />
              </div>

              {/* 访问地区统计 */}
              <div style={{ flex: '0 0 auto' }}>
                <VisitsByLocation />
              </div>

              {/* 信用卡 */}
              <div style={{ flex: '0 0 auto' }}>
                <CreditCard />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 响应式样式 */}
      <style jsx>{`
        @media (max-width: 1400px) {
          .dashboard-grid {
            grid-template-columns: minmax(0, 1fr) minmax(280px, 320px) !important;
          }
        }
        
        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: 1fr auto !important;
          }
          
          .side-content {
            flex-direction: row !important;
            overflow-x: auto !important;
            padding-bottom: 10px !important;
          }
          
          .side-content > div {
            min-width: 280px !important;
          }
        }
        
        @media (max-width: 768px) {
          .dashboard-content {
            padding: 10px !important;
          }
          
          .main-bottom {
            grid-template-columns: 1fr !important;
          }
          
          .dashboard-grid {
            gap: 10px !important;
          }
        }
        
        /* 隐藏滚动条但保持滚动功能 */
        .side-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .side-content::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .side-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        .side-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}