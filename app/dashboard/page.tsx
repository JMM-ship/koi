"use client";

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
  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-main">
        <TopBar />

        <div className="dashboard-content">
          <div className="dashboard-grid">
            {/* 左侧主要内容区 */}
            <div className="main-content">
              {/* 工作总结图表 */}
              <WorkSummaryChart />
              <div className="main-bottom">
                {/* 余额卡片组 */}
                <ExchangeBalance />

                {/* 团队成员列表 */}
                <TeamMembers />
              </div>
            </div>

            {/* 右侧边栏内容 */}
            <div className="side-content">
              {/* 访问地区统计 */}
              <VisitsByLocation />

              {/* 信用卡 */}
              <CreditCard />

              {/* 满意度 */}
              <SatisfactionRate />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}