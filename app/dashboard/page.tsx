"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardContent from "@/components/dashboard/DashboardContent";
import SubscriptionContent from "@/components/dashboard/SubscriptionContent";
import ApiKeysContent from "@/components/dashboard/ApiKeysContent";
import PlansContent from "@/components/dashboard/PlansContent";
import ProfileContent from "@/components/dashboard/ProfileContent";
import "@/public/assets/css/dashboard.css";

export default function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'subscription':
        return <SubscriptionContent />;
      case 'api-keys':
        return <ApiKeysContent />;
      case 'plans':
        return <PlansContent />;
      case 'profile':
        return <ProfileContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar 
        onCollapsedChange={setIsSidebarCollapsed} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className={`dashboard-main ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}