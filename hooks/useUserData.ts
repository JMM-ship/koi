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
  avatar_url: string;
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
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      
      // Update SWR cache
      await mutate(updatedUser, false);
      
      // Update NextAuth session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          ...updatedUser,
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
    return updateProfile({ avatar_url: avatarUrl });
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