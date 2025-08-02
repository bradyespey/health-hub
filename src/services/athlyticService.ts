export interface ReadinessData {
  date: string;
  readiness: number;
  hrv: number;
  restingHr: number;
  sleepScore: number;
}

export class AthlyticService {
  static async getReadinessData(days: number = 7): Promise<ReadinessData[]> {
    // Stub implementation - replace with Apple Health/Athlytic API
    // Will fetch from Firebase Function that processes Apple Health exports
    
    // Mock data
    const mockData: ReadinessData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        readiness: Math.floor(Math.random() * 30) + 70, // 70-100
        hrv: Math.floor(Math.random() * 20) + 30, // 30-50
        restingHr: Math.floor(Math.random() * 10) + 55, // 55-65
        sleepScore: Math.floor(Math.random() * 25) + 75, // 75-100
      });
    }
    
    return mockData;
  }

  static async getLatestReadiness(): Promise<ReadinessData> {
    const data = await this.getReadinessData(1);
    return data[0];
  }

  static getLastUpdated(): Date {
    // Mock last update time
    return new Date(Date.now() - Math.floor(Math.random() * 3600000)); // Random time within last hour
  }
}