import useSWR from 'swr';
import { AthlyticService } from '../services/athlyticService';
import { LoseItService } from '../services/loseItService';
import { AppleHealthService } from '../services/appleHealthService';
import { HabitifyService } from '../services/habitifyService';

// Custom hooks for data fetching with SWR

export function useReadinessData(days: number = 7) {
  return useSWR(`readiness-${days}`, () => AthlyticService.getReadinessData(days), {
    refreshInterval: 2 * 60 * 60 * 1000, // 2 hours
    revalidateOnFocus: false,
  });
}

export function useNutritionData(days: number = 7) {
  return useSWR(`nutrition-${days}`, () => LoseItService.getNutritionData(days), {
    refreshInterval: 30 * 60 * 1000, // 30 minutes
    revalidateOnFocus: false,
  });
}

export function useWeightData(days: number = 30) {
  return useSWR(`weight-${days}`, () => LoseItService.getWeightData(days), {
    refreshInterval: 60 * 60 * 1000, // 1 hour
    revalidateOnFocus: false,
  });
}

export function useHydrationData(days: number = 7) {
  return useSWR(`hydration-${days}`, () => AppleHealthService.getHydrationData(days), {
    refreshInterval: 15 * 60 * 1000, // 15 minutes
    revalidateOnFocus: false,
  });
}

export function useWorkoutData(days: number = 30) {
  return useSWR(`workouts-${days}`, () => AppleHealthService.getWorkoutData(days), {
    refreshInterval: 60 * 60 * 1000, // 1 hour
    revalidateOnFocus: false,
  });
}

export function useHabits() {
  return useSWR('habits', () => HabitifyService.getHabits(), {
    refreshInterval: 10 * 60 * 1000, // 10 minutes
    revalidateOnFocus: true,
  });
}

export function useTodayHydration() {
  return useSWR('today-hydration', () => AppleHealthService.getTodayHydration(), {
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    revalidateOnFocus: true,
  });
}