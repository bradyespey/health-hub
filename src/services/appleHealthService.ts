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
      // Return empty data, not mock
      return Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          date: date.toISOString().split('T')[0],
          waterOunces: 0,
          goalOunces: 120,
        };
      });
    }

    try {
      const hydrationData: HydrationData[] = [];
      const today = new Date();
      
      // Get data for the last N days, starting from Monday of current week
      const todayDayOfWeek = today.getDay(); // 0=Sun, 1=Mon, etc
      const mondayOffset = todayDayOfWeek === 0 ? -6 : 1 - todayDayOfWeek;
      const mondayDate = new Date(today);
      mondayDate.setDate(today.getDate() + mondayOffset);
      
      // Generate 7 days starting from Monday
      for (let i = 0; i < days; i++) {
        const date = new Date(mondayDate);
        date.setDate(mondayDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Try to get hydration data from Firestore
        // Health Auto Export sends metrics with snake_case names
        const docRef = doc(db, 'appleHealth', userId, dateStr, 'dietary_water');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as AppleHealthRecord;
          hydrationData.push({
            date: dateStr,
            waterOunces: Math.round(data.value), // Data is already in ounces from Health Auto Export
            goalOunces: 120,
          });
        } else {
          // No data for this date, use zero
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
      // Return zeros, not mock
      return Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          date: date.toISOString().split('T')[0],
          waterOunces: 0,
          goalOunces: 120,
        };
      });
    }
  }

  static async getWorkoutData(days: number = 30, userId?: string): Promise<WorkoutData[]> {
    if (!userId) {
      return [];
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
        // Health Auto Export sends metrics with snake_case names
        const exerciseRef = doc(db, 'appleHealth', userId, dateStr, 'apple_exercise_time');
        const energyRef = doc(db, 'appleHealth', userId, dateStr, 'active_energy');
        
        const [exerciseSnap, energySnap] = await Promise.all([
          getDoc(exerciseRef),
          getDoc(energyRef)
        ]);
        
        if (exerciseSnap.exists() || energySnap.exists()) {
          const exerciseData = exerciseSnap.exists() ? exerciseSnap.data() as AppleHealthRecord : null;
          const energyData = energySnap.exists() ? energySnap.data() as AppleHealthRecord : null;
          
          // Only add workout if we have exercise time or energy burned
          if (exerciseData || energyData) {
            workoutData.push({
              date: dateStr,
              type: 'Exercise',
              duration: exerciseData ? Math.round(exerciseData.value) : 0, // minutes
              calories: energyData ? Math.round(energyData.value) : 0, // kcal
              rpe: undefined, // RPE will need to be entered manually
            });
          }
        }
      }
      
      return workoutData;
    } catch (error) {
      console.error('Error fetching workout data from Firestore:', error);
      // Return empty array instead of mock data
      return [];
    }
  }

  static async getTodayHydration(userId: string): Promise<HydrationData> {
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

  static async getNutritionData(days: number, userId: string): Promise<any[]> {
    try {
      if (!userId) {
        return Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return {
            date: date.toISOString().split('T')[0],
            calories: 0,
            calorieTarget: 1700,
            protein: 0,
            carbs: 0,
            fat: 0
          };
        });
      }

      const nutritionData = [];
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        // Use local date string to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        try {
          // Get dietary calories (consumed, not burned)
          const dietaryRef = doc(db, 'appleHealth', userId, dateStr, 'dietary_energy_consumed');
          const dietarySnap = await getDoc(dietaryRef);
          
          const dietaryCalories = dietarySnap.exists() ? dietarySnap.data().value || 0 : 0;
          
          nutritionData.push({
            date: dateStr,
            calories: Math.round(dietaryCalories),
            calorieTarget: 1700,
            protein: 0, // Apple Health doesn't track macros well
            carbs: 0,
            fat: 0
          });
        } catch (error) {
          console.error(`Error fetching nutrition for ${dateStr}:`, error);
          nutritionData.push({
            date: dateStr,
            calories: 0,
            calorieTarget: 1700,
            protein: 0,
            carbs: 0,
            fat: 0
          });
        }
      }
      
      return nutritionData;
    } catch (error) {
      console.error('Error fetching nutrition data from Firestore:', error);
      return Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          calories: 0,
          calorieTarget: 1700,
          protein: 0,
          carbs: 0,
          fat: 0
        };
      });
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
      return [];
    }

    try {
      const weightData: WeightData[] = [];
      const today = new Date();
      
      // Get weight data for the last N days
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Try to get weight data from Firestore
        // Health Auto Export sends metrics with snake_case names
        const docRef = doc(db, 'appleHealth', userId, dateStr, 'body_mass');
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
        }
      }
      
      // Return only actual data, no mock data
      return weightData;
    } catch (error) {
      console.error('Error fetching weight data from Firestore:', error);
      return [];
    }
  }

}