"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardContent from "@/components/dashboard/DashboardContent";
import SubscriptionContent from "@/components/dashboard/SubscriptionContent";
import ApiKeysContent from "@/components/dashboard/ApiKeysContent";
import PlansContent from "@/components/dashboard/PlansContent";
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
        return (
          <div className="dashboard-grid">
            <div className="main-content">
              <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>Profile</h1>
              <p style={{ fontSize: '14px', color: '#999' }}>Manage your profile settings</p>
            </div>
          </div>
        );
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