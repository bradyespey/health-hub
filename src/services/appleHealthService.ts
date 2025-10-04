import { db } from '@/lib/firebaseConfig';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';

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

export interface AppleHealthRecord {
  type: string;
  date: string;
  value: number;
  unit: string;
  timestamp: any;
  source: string;
}

export interface WeightData {
  date: string;
  weight: number;
}

export class AppleHealthService {
  static async getHydrationData(days: number = 7, userId?: string): Promise<HydrationData[]> {
    if (!userId) {
      return this.getMockHydrationData(days);
    }

    try {
      const hydrationData: HydrationData[] = [];
      const today = new Date();
      
      // Get data for the last N days
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Try to get hydration data from Firestore
        const docRef = doc(db, 'appleHealth', userId, dateStr, 'DietaryWater');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as AppleHealthRecord;
          hydrationData.push({
            date: dateStr,
            waterOunces: Math.round(data.value * 33.814), // Convert liters to oz (if needed)
            goalOunces: 120, // Default goal
          });
        } else {
          // No data for this date, use zero or skip
          hydrationData.push({
            date: dateStr,
            waterOunces: 0,
            goalOunces: 120,
          });
        }
      }
      
      return hydrationData;
    } catch (error) {
      console.error('Error fetching hydration data from Firestore:', error);
      return this.getMockHydrationData(days);
    }
  }

  private static getMockHydrationData(days: number): HydrationData[] {
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

  static async getWorkoutData(days: number = 30, userId?: string): Promise<WorkoutData[]> {
    if (!userId) {
      return this.getMockWorkoutData(days);
    }

    try {
      const workoutData: WorkoutData[] = [];
      const today = new Date();
      
      // Get workout data for the last N days
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Try to get workout data from multiple potential documents
        const workoutTypes = ['Workout', 'Exercise', 'AppleExerciseTime', 'ActiveEnergyBurned'];
        
        for (const workoutType of workoutTypes) {
          const docRef = doc(db, 'appleHealth', userId, dateStr, workoutType);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as AppleHealthRecord;
            
            // Convert Apple Health workout data to our format
            workoutData.push({
              date: dateStr,
              type: workoutType === 'AppleExerciseTime' ? 'Exercise' : 'Workout',
              duration: workoutType === 'AppleExerciseTime' ? data.value : 45, // minutes
              calories: workoutType === 'ActiveEnergyBurned' ? data.value : 300,
              rpe: undefined, // RPE will need to be entered manually
            });
            break; // Only add one workout per day
          }
        }
      }
      
      return workoutData;
    } catch (error) {
      console.error('Error fetching workout data from Firestore:', error);
      return this.getMockWorkoutData(days);
    }
  }

  private static getMockWorkoutData(days: number): WorkoutData[] {
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

  static async getTodayHydration(userId?: string): Promise<HydrationData> {
    const data = await this.getHydrationData(1, userId);
    return data[0];
  }

  static async getLastUpdated(userId?: string): Promise<Date> {
    if (!userId) {
      return new Date(Date.now() - Math.floor(Math.random() * 900000)); // Random time within last 15 min
    }

    try {
      const latestRef = doc(db, 'appleHealth', userId, 'latest', 'summary');
      const latestSnap = await getDoc(latestRef);
      
      if (latestSnap.exists()) {
        const data = latestSnap.data();
        return data.lastUpdated?.toDate() || new Date();
      }
      
      return new Date(0); // Very old date if no data
    } catch (error) {
      console.error('Error fetching last updated time:', error);
      return new Date(0);
    }
  }

  // Helper method to get all available health data types for a user
  static async getAvailableDataTypes(userId: string, date?: string): Promise<string[]> {
    if (!userId) return [];

    try {
      const dateStr = date || new Date().toISOString().split('T')[0];
      const dateRef = collection(db, 'appleHealth', userId, dateStr);
      const snapshot = await getDocs(dateRef);
      
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error fetching available data types:', error);
      return [];
    }
  }

  // Helper method to get raw health data for debugging
  static async getRawHealthData(userId: string, date: string, type: string): Promise<AppleHealthRecord | null> {
    try {
      const docRef = doc(db, 'appleHealth', userId, date, type);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as AppleHealthRecord;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching raw health data:', error);
      return null;
    }
  }

  static async getWeightData(days: number = 30, userId?: string): Promise<WeightData[]> {
    if (!userId) {
      return this.getMockWeightData(days);
    }

    try {
      const weightData: WeightData[] = [];
      const today = new Date();
      
      // Get weight data for the last N days
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Try to get weight data from Firestore - check multiple possible types
        const weightTypes = ['BodyMass', 'Weight', 'BodyWeight'];
        
        for (const weightType of weightTypes) {
          const docRef = doc(db, 'appleHealth', userId, dateStr, weightType);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as AppleHealthRecord;
            
            // Convert to lbs if needed (Apple Health might store in kg)
            let weightInLbs = data.value;
            if (data.unit === 'kg') {
              weightInLbs = data.value * 2.20462;
            }
            
            weightData.push({
              date: dateStr,
              weight: Math.round(weightInLbs * 10) / 10, // Round to 1 decimal
            });
            break; // Only add one weight per day
          }
        }
      }
      
      // If no data found, return mock data
      return weightData.length > 0 ? weightData : this.getMockWeightData(days);
    } catch (error) {
      console.error('Error fetching weight data from Firestore:', error);
      return this.getMockWeightData(days);
    }
  }

  private static getMockWeightData(days: number): WeightData[] {
    const mockData: WeightData[] = [];
    const today = new Date();
    const startWeight = 210;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate gradual weight loss with some fluctuation
      const progress = (days - 1 - i) / days;
      const weightLoss = progress * 5; // 5 lbs total loss over the period
      const fluctuation = (Math.random() - 0.5) * 2; // ±1 lb daily fluctuation
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        weight: Math.round((startWeight - weightLoss + fluctuation) * 10) / 10,
      });
    }
    
    return mockData;
  }
}