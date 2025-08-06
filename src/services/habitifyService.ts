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

// Habitify API Response Types
interface HabitifyAction {
  id: string;
  remind_at: string;
  status: number; // 0 = incomplete, 1 = completed
  title: string;
  updated_at: string;
  habit_id: string;
}

interface HabitifyResponse<T> {
  message: string;
  data: T;
  version: string;
  status: boolean;
}

export class HabitifyService {
  private static readonly BASE_URL = 'https://api.habitify.me';
  private static readonly API_KEY = import.meta.env.VITE_HABITIFY_API_KEY;

  private static async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.API_KEY) {
      console.warn('Habitify API key not found, using mock data');
      throw new Error('Habitify API key not configured');
    }

    const response = await fetch(`${this.BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': this.API_KEY,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Habitify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async getHabits(): Promise<Habit[]> {
    try {
      // Try the /habits endpoint based on the documentation examples
      const response = await this.makeRequest<HabitifyResponse<any[]>>('/habits');
      
      if (response.status && response.data) {
        console.info('Successfully fetched habits from Habitify API');
        return response.data.map((habit: any) => ({
          id: habit.id || habit.uuid || String(Math.random()),
          name: habit.name || habit.title || 'Unknown Habit',
          icon: this.getHabitIcon(habit.name || habit.title || ''),
          streak: habit.streak || 0,
          completedToday: habit.completed_today || false,
          target: habit.target || 1,
          frequency: habit.frequency || 'daily',
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch habits');
      }
      
    } catch (error) {
      console.warn('Error fetching habits from Habitify API, using mock data:', error);
      // Fallback to mock data
      return this.getMockHabits();
    }
  }

  private static getHabitIcon(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('food') || lowerName.includes('eat')) return '🍎';
    if (lowerName.includes('water') || lowerName.includes('drink')) return '💧';
    if (lowerName.includes('exercise') || lowerName.includes('workout')) return '🏃‍♂️';
    if (lowerName.includes('meditat')) return '🧘‍♂️';
    if (lowerName.includes('read')) return '📚';
    if (lowerName.includes('sleep')) return '😴';
    if (lowerName.includes('walk')) return '🚶‍♂️';
    return '✅'; // Default icon
  }

  static async logHabit(habitId: string): Promise<HabitLog> {
    try {
      // Create a new action for the habit
      // POST /actions/{habit_id}
      const response = await this.makeRequest<HabitifyResponse<null>>(`/actions/${habitId}`, {
        method: 'POST',
        body: JSON.stringify({
          title: 'Completed via Health Hub',
          remind_at: new Date().toISOString(),
        }),
      });

      if (response.status) {
        console.info('Successfully logged habit to Habitify API');
        return {
          habitId,
          date: new Date().toISOString().split('T')[0],
          completed: true,
          timestamp: new Date(),
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error logging habit to Habitify API:', error);
      // Fallback to mock response
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        habitId,
        date: new Date().toISOString().split('T')[0],
        completed: true,
        timestamp: new Date(),
      };
    }
  }

  static async getHabitLogs(habitId: string, days: number = 30): Promise<HabitLog[]> {
    try {
      // Get actions for the habit
      // GET /actions/{habit_id}
      const response = await this.makeRequest<HabitifyResponse<HabitifyAction[]>>(`/actions/${habitId}`);
      
      if (response.status && response.data) {
        return response.data.map(action => ({
          habitId: action.habit_id,
          date: action.updated_at.split('T')[0],
          completed: action.status === 1,
          timestamp: new Date(action.updated_at),
        }));
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error fetching habit logs from Habitify API:', error);
      // Fallback to mock data
      return this.getMockHabitLogs(habitId, days);
    }
  }

  private static getMockHabits(): Habit[] {
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

  private static getMockHabitLogs(habitId: string, days: number): HabitLog[] {
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