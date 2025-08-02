export interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  completedToday: boolean;
  target: number; // times per day/week
  frequency: 'daily' | 'weekly';
}

export interface HabitLog {
  habitId: string;
  date: string;
  completed: boolean;
  timestamp: Date;
}

export class HabitifyService {
  static async getHabits(): Promise<Habit[]> {
    // Stub implementation - replace with Habitify API
    // GET /habits endpoint
    
    // Mock habits data
    return [
      {
        id: '1',
        name: 'Log Food',
        icon: '🍎',
        streak: 12,
        completedToday: Math.random() > 0.5,
        target: 3,
        frequency: 'daily',
      },
      {
        id: '2',
        name: 'Drink Water',
        icon: '💧',
        streak: 8,
        completedToday: Math.random() > 0.3,
        target: 8,
        frequency: 'daily',
      },
      {
        id: '3',
        name: 'Exercise',
        icon: '🏃‍♂️',
        streak: 5,
        completedToday: Math.random() > 0.4,
        target: 5,
        frequency: 'weekly',
      },
      {
        id: '4',
        name: 'Meditation',
        icon: '🧘‍♂️',
        streak: 15,
        completedToday: Math.random() > 0.6,
        target: 1,
        frequency: 'daily',
      },
      {
        id: '5',
        name: 'Read',
        icon: '📚',
        streak: 3,
        completedToday: Math.random() > 0.7,
        target: 1,
        frequency: 'daily',
      },
    ];
  }

  static async logHabit(habitId: string): Promise<HabitLog> {
    // Stub implementation - replace with Habitify API
    // POST /habits/{id}/logs endpoint
    
    // Mock logging with delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      habitId,
      date: new Date().toISOString().split('T')[0],
      completed: true,
      timestamp: new Date(),
    };
  }

  static async getHabitLogs(habitId: string, days: number = 30): Promise<HabitLog[]> {
    // Stub implementation - replace with Habitify API
    
    const logs: HabitLog[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Random completion pattern
      if (Math.random() > 0.3) {
        logs.push({
          habitId,
          date: date.toISOString().split('T')[0],
          completed: true,
          timestamp: date,
        });
      }
    }
    
    return logs;
  }

  static getLastUpdated(): Date {
    return new Date(Date.now() - Math.floor(Math.random() * 600000)); // Random time within last 10 min
  }
}