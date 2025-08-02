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
    // Stub implementation - replace with Lose It! API
    // oauth2 + /v2/dailysummary endpoint
    
    // Mock data
    const mockData: NutritionData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const calories = Math.floor(Math.random() * 500) + 1400; // 1400-1900
      const protein = Math.floor(calories * 0.25 / 4); // 25% of calories from protein
      const fat = Math.floor(calories * 0.30 / 9); // 30% from fat
      const carbs = Math.floor((calories - (protein * 4) - (fat * 9)) / 4); // Rest from carbs
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        calories,
        protein,
        carbs,
        fat,
        calorieTarget: 1700,
      });
    }
    
    return mockData;
  }

  static async getWeightData(days: number = 30): Promise<WeightData[]> {
    // Stub implementation - replace with Lose It! API or Apple Health
    
    // Mock data showing gradual weight loss
    const mockData: WeightData[] = [];
    const today = new Date();
    const startWeight = 212;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate gradual weight loss with some fluctuation
      const progress = (days - 1 - i) / days;
      const weightLoss = progress * 15; // 15 lbs total loss
      const fluctuation = (Math.random() - 0.5) * 2; // ±1 lb daily fluctuation
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        weight: Math.round((startWeight - weightLoss + fluctuation) * 10) / 10,
      });
    }
    
    return mockData;
  }

  static getLastUpdated(): Date {
    return new Date(Date.now() - Math.floor(Math.random() * 1800000)); // Random time within last 30 min
  }
}