import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { useCallback } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to fetch user data');
  }
  return res.json();
});

export interface UserProfile {
  uuid: string;
  email: string;
  nickname: string;
  avatarUrl: string;
  role: string;
  status: string;
  planType: string;
  totalCredits: number;
  created_at: string;
}

export function useUserData() {
  const { data: session, update: updateSession } = useSession();
  
  // Use SWR to manage user profile data
  const { data, error, isLoading, mutate } = useSWR<UserProfile>(
    session?.user?.email ? '/api/profile' : null,
    fetcher,
    {
      revalidateOnFocus: true, // Changed from false
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Reduced from 5000
      errorRetryCount: 3,
      errorRetryInterval: 3000,
    }
  );

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      // Map avatarUrl for API compatibility
      const apiData = {
        nickname: updates.nickname,
        avatarUrl: updates.avatarUrl,
      };
      
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      
      // Normalize the data structure
      const normalizedUser = {
        ...updatedUser,
        avatarUrl: updatedUser.avatarUrl || updatedUser.avatar_url || "",
      };
      
      // Update SWR cache
      await mutate(normalizedUser, false);
      
      // Update NextAuth session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          ...normalizedUser,
        },
      });

      return updatedUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, [session, updateSession, mutate]);

  // Update avatar
  const updateAvatar = useCallback(async (avatarUrl: string) => {
    return updateProfile({ avatarUrl: avatarUrl });
  }, [updateProfile]);

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    // Refresh both SWR cache and session
    const refreshedData = await mutate();
    if (refreshedData) {
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          ...refreshedData,
        },
      });
    }
    return refreshedData;
  }, [mutate, session, updateSession]);

  return {
    user: data || session?.user,
    isLoading,
    error,
    updateProfile,
    updateAvatar,
    refreshUserData,
  };
}