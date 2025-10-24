import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { setAuthTokenGetter } from '@/lib/api-client';

/**
 * Hook to connect Clerk authentication with the API client
 * Call this once in your root layout or app provider
 */
export function useApiAuth() {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set the token getter function for the API client
    setAuthTokenGetter(async () => {
      try {
        return await getToken();
      } catch (error) {
        console.error('Failed to get auth token:', error);
        return null;
      }
    });
  }, []); // Empty deps - getToken is stable from Clerk
}
