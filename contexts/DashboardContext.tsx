'use client';

import React, { createContext, useContext } from 'react';
import { useDashboardData, DashboardData } from '@/hooks/useDashboardData';

interface DashboardContextType {
  data: DashboardData | undefined;
  isLoading: boolean;
  error: any;
  refreshData: () => Promise<DashboardData | undefined>;
  updateData: (updater: (data: DashboardData | undefined) => DashboardData | undefined) => Promise<DashboardData | undefined>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { data, error, isLoading, refreshData, updateData } = useDashboardData();

  return (
    <DashboardContext.Provider
      value={{
        data,
        isLoading,
        error,
        refreshData,
        updateData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook to use dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

// Helper hooks for specific data
export function useCreditBalance() {
  const { data } = useDashboard();
  return data?.creditBalance;
}

export function useCreditStats() {
  const { data } = useDashboard();
  return data?.creditStats;
}

export function useUserPackage() {
  const { data } = useDashboard();
  return data?.userPackage;
}

export function useUserInfo() {
  const { data } = useDashboard();
  return data?.userInfo;
}