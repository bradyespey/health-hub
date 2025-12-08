import useSWR from 'swr';
import { AthlyticService } from '../services/athlyticService';
import { LoseItService } from '../services/loseItService';
import { AppleHealthService } from '../services/appleHealthService';
import { HabitifyService } from '../services/habitifyService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hooks for data fetching with SWR.
 * All hooks support demo mode (mock data) when user is not authenticated.
 */

/**
 * Fetches readiness and recovery data (HRV, resting HR, sleep scores).
 * Returns mock data in demo mode.
 * @param days - Number of days to fetch (default: 7)
 */
export function useReadinessData(days: number = 7) {
  return useSWR(`readiness-${days}`, () => AthlyticService.getReadinessData(days), {
    refreshInterval: 2 * 60 * 60 * 1000, // 2 hours
    revalidateOnFocus: false,
  });
}

/**
 * Fetches nutrition data (calories and macros).
 * Returns mock data when user is not authenticated.
 * @param days - Number of days to fetch (default: 7)
 */
export function useNutritionData(days: number = 7) {
  const { user } = useAuth();
  // Single-user app: data stored under 'brady' userId
  // If no user, pass undefined to service to get mock data
  return useSWR(
    `nutrition-${days}-${user ? 'brady' : 'demo'}`,
    () => AppleHealthService.getNutritionData(days, user ? 'brady' : ''),
    {
      refreshInterval: 30 * 60 * 1000, // 30 minutes
      revalidateOnFocus: false,
    }
  );
}

/**
 * Fetches weight tracking data.
 * Returns mock data when user is not authenticated.
 * @param days - Number of days to fetch (default: 30)
 */
export function useWeightData(days: number = 30) {
  const { user } = useAuth();
  // Single-user app: data stored under 'brady' userId
  return useSWR(
    `weight-${days}-${user ? 'brady' : 'demo'}`,
    () => AppleHealthService.getWeightData(days, user ? 'brady' : undefined),
    {
      refreshInterval: 60 * 60 * 1000, // 1 hour
      revalidateOnFocus: false,
    }
  );
}

/**
 * Fetches hydration (water intake) data.
 * Returns mock data when user is not authenticated.
 * @param days - Number of days to fetch (default: 7)
 */
export function useHydrationData(days: number = 7) {
  const { user } = useAuth();
  // Single-user app: data stored under 'brady' userId
  return useSWR(
    `hydration-${days}-${user ? 'brady' : 'demo'}`,
    () => AppleHealthService.getHydrationData(days, user ? 'brady' : undefined),
    {
      refreshInterval: 15 * 60 * 1000, // 15 minutes
      revalidateOnFocus: false,
    }
  );
}

/**
 * Fetches workout and training data.
 * Returns mock data when user is not authenticated.
 * @param days - Number of days to fetch (default: 30)
 */
export function useWorkoutData(days: number = 30) {
  const { user } = useAuth();
  // Single-user app: data stored under 'brady' userId
  return useSWR(
    `workouts-${days}-${user ? 'brady' : 'demo'}`,
    () => AppleHealthService.getWorkoutData(days, user ? 'brady' : undefined),
    {
      refreshInterval: 60 * 60 * 1000, // 1 hour
      revalidateOnFocus: false,
    }
  );
}

/**
 * Fetches habits from Habitify API.
 * Falls back to mock data if API key is not configured.
 */
export function useHabits() {
  // Always try to fetch - service will handle mock data if no key
  return useSWR(
    'habits', 
    () => HabitifyService.getHabits(),
    {
      refreshInterval: 2 * 60 * 1000, // 2 minutes for better sync
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0, // Force fresh data every time
      onError: (error) => {
        // Silently handle API key errors
        if (error.message.includes('API key not configured')) {
          return;
        }
        console.error('Habitify API error:', error);
      },
    }
  );
}

/**
 * Fetches today's hydration data.
 * Returns mock data when user is not authenticated.
 */
export function useTodayHydration() {
  const { user } = useAuth();
  // Single-user app: data stored under 'brady' userId
  return useSWR(
    `today-hydration-${user ? 'brady' : 'demo'}`,
    () => AppleHealthService.getTodayHydration(user ? 'brady' : ''),
    {
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      revalidateOnFocus: true,
    }
  );
}