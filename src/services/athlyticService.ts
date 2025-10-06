export interface ReadinessData {
  date: string;
  readiness: number;
  hrv: number;
  restingHr: number;
  sleepScore: number;
}

export class AthlyticService {
  static async getReadinessData(days: number = 7): Promise<ReadinessData[]> {
    // TODO: Implement Apple Health HRV and readiness data fetching
    // Will fetch from Firebase Function that processes Apple Health exports
    return [];
  }

  static async getLatestReadiness(): Promise<ReadinessData | null> {
    const data = await this.getReadinessData(1);
    return data.length > 0 ? data[0] : null;
  }

  static getLastUpdated(): Date {
    return new Date();
  }
}