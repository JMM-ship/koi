import useSWR from 'swr';

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return res.json();
});

// Dashboard data types
export interface DashboardData {
  userInfo: any;
  creditBalance: {
    packageCredits: number;
    independentCredits: number;
    totalUsed: number;
    totalPurchased: number;
  };
  creditStats: {
    today: { amount: number; percentage: number };
    week: { amount: number; percentage: number };
    month: { amount: number; percentage: number };
  };
  userPackage: any;
  modelUsage?: any[];
}

// Custom hook for dashboard data
export function useDashboardData() {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    '/api/dashboard',
    fetcher,
    {
      // No background polling; refresh only on focus/reconnect or explicit actions
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 0,
      dedupingInterval: 5000,
      errorRetryCount: 3,
      errorRetryInterval: 3000,
    }
  );

  // Manual refresh function
  const refreshData = () => {
    return mutate();
  };

  // Update specific data without refetching
  const updateData = (updater: (data: DashboardData | undefined) => DashboardData | undefined) => {
    return mutate(updater, false);
  };

  // Force refresh after purchase (bypasses cache)
  const forceRefreshAfterPurchase = async () => {
    // Clear the cache first, then refetch
    await mutate(undefined, true);
    return mutate();
  };

  return {
    data,
    error,
    isLoading,
    refreshData,
    updateData,
    forceRefreshAfterPurchase,
    mutate,
  };
}
