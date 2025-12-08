export interface ReadinessData {
  date: string;
  readiness: number;
  hrv: number;
  restingHr: number;
  sleepScore: number;
}

/**
 * Service for fetching readiness and recovery data.
 * Currently returns mock data for demo purposes.
 */
export class AthlyticService {
  /**
   * Fetches readiness data for the specified number of days.
   * @param days - Number of days to fetch (default: 7)
   * @returns Array of readiness data with HRV, resting HR, and sleep scores
   */
  static async getReadinessData(days: number = 7): Promise<ReadinessData[]> {
    // Return mock data for demo
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: date.toISOString().split('T')[0],
        readiness: Math.floor(Math.random() * (100 - 60 + 1)) + 60,
        hrv: Math.floor(Math.random() * (80 - 40 + 1)) + 40,
        restingHr: Math.floor(Math.random() * (65 - 45 + 1)) + 45,
        sleepScore: Math.floor(Math.random() * (100 - 70 + 1)) + 70,
      };
    });
  }

  static async getLatestReadiness(): Promise<ReadinessData | null> {
    const data = await this.getReadinessData(1);
    return data.length > 0 ? data[0] : null;
  }

  static getLastUpdated(): Date {
    return new Date();
  }
}