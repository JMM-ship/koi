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
    <div className="dashboard-container">
      <Sidebar onCollapsedChange={setIsSidebarCollapsed} />

      <div className={`dashboard-main ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
        {/* <TopBar /> */}

        <div className="dashboard-content">
          <div className="dashboard-grid">
            {/* 左侧主要内容区 */}
            <div className="main-content">
              {/* 工作总结图表 */}
              <div className="main-content-chart">
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
            <div className="side-content">
              {/* 满意度 */}
              <div className="side-content-item">
                <SatisfactionRate />
              </div>

              {/* 访问地区统计 */}
              <div className="side-content-item">
                <VisitsByLocation />
              </div>

              {/* 信用卡 */}
              <div className="side-content-item">
                <CreditCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}