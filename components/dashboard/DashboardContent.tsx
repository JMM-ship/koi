"use client";

import { useState } from "react";
import { DashboardProvider } from "@/contexts/DashboardContext";
import WorkSummaryChart from "@/components/dashboard/WorkSummaryChart";
import VisitsByLocation from "@/components/dashboard/VisitsByLocation";
import CreditCard from "@/components/dashboard/CreditCard";
import ExchangeBalance from "@/components/dashboard/ExchangeBalance";
import TeamMembers from "@/components/dashboard/TeamMembers";
import SatisfactionRate from "@/components/dashboard/SatisfactionRate";
import IndependentCredits from "@/components/dashboard/IndependentCredits";
import CreditTestButton from "@/components/dashboard/CreditTestButton";

interface DashboardContentProps {
  onNavigateToPlans?: () => void;
}

export default function DashboardContent({ onNavigateToPlans }: DashboardContentProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh dashboard data after credits are used
  const handleCreditsUsed = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <DashboardProvider>
      <div className="dashboard-grid">
      {/* 左侧主要内容区 */}
      <div className="main-content">
        {/* 消耗趋势图 */}
        <div className="main-content-chart">
          <WorkSummaryChart />
        </div>

        <div className="main-bottom">
          {/* 积分消耗排名 */}
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
        <div className="side-content-top">
          {/* 满意度 */}
          <div className="side-content-item">
            <SatisfactionRate />
          </div>

          {/* 访问地区统计 */}
          <div className="side-content-item">
            <VisitsByLocation onUpgradeClick={onNavigateToPlans} />
          </div>
        </div>

        {/* 独立积分卡片 - 与左侧底部对齐 */}
        <div className="side-content-bottom" key={refreshKey}>
          <IndependentCredits />
        </div>

        {/* 信用卡
        <div className="side-content-item">
          <CreditCard />
        </div> */}
      </div>

      {/* Credit Test Button */}
      {/* <CreditTestButton onCreditsUsed={handleCreditsUsed} /> */}
    </div>
    </DashboardProvider>
  );
}