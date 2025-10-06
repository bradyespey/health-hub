import useSWR from 'swr';
import { AthlyticService } from '../services/athlyticService';
import { LoseItService } from '../services/loseItService';
import { AppleHealthService } from '../services/appleHealthService';
import { HabitifyService } from '../services/habitifyService';
import { useAuth } from '@/contexts/AuthContext';

// Custom hooks for data fetching with SWR

export function useReadinessData(days: number = 7) {
  return useSWR(`readiness-${days}`, () => AthlyticService.getReadinessData(days), {
    refreshInterval: 2 * 60 * 60 * 1000, // 2 hours
    revalidateOnFocus: false,
  });
}

export function useNutritionData(days: number = 7) {
  const { user } = useAuth();
  // Single-user app: data stored under 'brady' userId
  return useSWR(
    user ? `nutrition-${days}-brady` : null,
    () => AppleHealthService.getNutritionData(days, 'brady'),
    {
      refreshInterval: 30 * 60 * 1000, // 30 minutes
      revalidateOnFocus: false,
    }
  );
}

export function useWeightData(days: number = 30) {
  const { user } = useAuth();
  // Single-user app: data stored under 'brady' userId
  return useSWR(
    user ? `weight-${days}-brady` : null,
    () => AppleHealthService.getWeightData(days, 'brady'),
    {
      refreshInterval: 60 * 60 * 1000, // 1 hour
      revalidateOnFocus: false,
    }
  );
}

export function useHydrationData(days: number = 7) {
  const { user } = useAuth();
  // Single-user app: data stored under 'brady' userId
  return useSWR(
    user ? `hydration-${days}-brady` : null,
    () => AppleHealthService.getHydrationData(days, 'brady'),
    {
      refreshInterval: 15 * 60 * 1000, // 15 minutes
      revalidateOnFocus: false,
    }
  );
}

export function useWorkoutData(days: number = 30) {
  const { user } = useAuth();
  // Single-user app: data stored under 'brady' userId
  return useSWR(
    user ? `workouts-${days}-brady` : null,
    () => AppleHealthService.getWorkoutData(days, 'brady'),
    {
      refreshInterval: 60 * 60 * 1000, // 1 hour
      revalidateOnFocus: false,
    }
  );
}

export function useHabits() {
  return useSWR('habits', () => HabitifyService.getHabits(), {
    refreshInterval: 2 * 60 * 1000, // 2 minutes for better sync
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 0, // Force fresh data every time
  });
}

export function useTodayHydration() {
  const { user } = useAuth();
  // Single-user app: data stored under 'brady' userId
  return useSWR(
    user ? `today-hydration-brady` : null,
    () => AppleHealthService.getTodayHydration('brady'),
    {
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      revalidateOnFocus: true,
    }
  );
}