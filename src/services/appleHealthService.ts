export interface HydrationData {
  date: string;
  waterOunces: number;
  goalOunces: number;
}

export interface WorkoutData {
  date: string;
  type: string;
  duration: number; // minutes
  calories: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
}

export class AppleHealthService {
  static async getHydrationData(days: number = 7): Promise<HydrationData[]> {
    // Stub implementation - replace with iOS Shortcut automation
    // iOS Shortcut will POST JSON to Firebase Function
    
    // Mock data
    const mockData: HydrationData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const goalOunces = 120; // 120 oz daily goal
      const waterOunces = Math.floor(Math.random() * 40) + 80; // 80-120 oz
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        waterOunces,
        goalOunces,
      });
    }
    
    return mockData;
  }

  static async getWorkoutData(days: number = 30): Promise<WorkoutData[]> {
    // Stub implementation - replace with Apple Health workout data
    
    const workoutTypes = ['Running', 'Cycling', 'Strength Training', 'Swimming', 'Yoga', 'Walking'];
    const mockData: WorkoutData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Random chance of workout each day (70%)
      if (Math.random() > 0.3) {
        const type = workoutTypes[Math.floor(Math.random() * workoutTypes.length)];
        const duration = Math.floor(Math.random() * 60) + 30; // 30-90 minutes
        const calories = duration * (Math.floor(Math.random() * 5) + 8); // 8-12 cal/min
        const rpe = Math.floor(Math.random() * 4) + 6; // RPE 6-10
        
        mockData.push({
          date: date.toISOString().split('T')[0],
          type,
          duration,
          calories,
          rpe,
        });
      }
    }
    
    return mockData;
  }

  static async getTodayHydration(): Promise<HydrationData> {
    const data = await this.getHydrationData(1);
    return data[0];
  }

  static getLastUpdated(): Date {
    return new Date(Date.now() - Math.floor(Math.random() * 900000)); // Random time within last 15 min
  }
}