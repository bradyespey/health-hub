export interface NutritionData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieTarget: number;
}

export interface WeightData {
  date: string;
  weight: number;
}

export class LoseItService {
  static async getNutritionData(days: number = 7): Promise<NutritionData[]> {
    // Lose It! doesn't have an API - use Apple Health instead
    return [];
  }

  static async getWeightData(days: number = 30): Promise<WeightData[]> {
    // Lose It! doesn't have an API - use Apple Health instead
    return [];
  }

  static getLastUpdated(): Date {
    return new Date();
  }
}