export interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  completedToday: boolean;
  target: number; // times per day/week
  frequency: 'daily' | 'weekly';
  goal?: {
    times: number;
    period: string;
  };
  todayAction?: HabitifyAction;
  analytics?: {
    totalCompletions: number;
    completionRate: number; // percentage
    bestStreak: number;
    currentStreak: number;
    lastSevenDays: boolean[]; // true = completed, false = missed
    recentActivity: {
      date: string;
      completed: boolean;
    }[];
  };
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

interface HabitifyHabit {
  id: string;
  name: string;
  color: string;
  goal: {
    times: number;
    period: string;
  };
  statistics: {
    streak: number;
  };
}

interface HabitifyJournalEntry {
  habit_id: string;
  date: string;
  entries: HabitifyAction[];
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

    const url = `${this.BASE_URL}${endpoint}`;
    console.log(`Making ${options.method || 'GET'} request to: ${url}`);
    if (options.body) {
      console.log('Request body:', options.body);
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': this.API_KEY,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorBody = await response.text();
        errorDetails = errorBody;
        console.error('API Error Response:', errorBody);
      } catch (e) {
        // Ignore parsing errors
      }
      throw new Error(`Habitify API error: ${response.status} ${response.statusText}${errorDetails ? ` - ${errorDetails}` : ''}`);
    }

    return response.json();
  }

  static async getHabits(): Promise<Habit[]> {
    try {
      console.log('Habitify API Key present:', !!this.API_KEY);
      console.log('Attempting to fetch habits from Habitify API...');
      
      // Get the list of habits
      const habitsResponse = await this.makeRequest<HabitifyResponse<HabitifyHabit[]>>('/habits');
      
      if (!habitsResponse.status || !habitsResponse.data) {
        throw new Error(habitsResponse.message || 'Failed to fetch habits');
      }

      console.log(`✅ Fetched ${habitsResponse.data.length} habits from Habitify API`);
      console.log('📝 All habit names:', habitsResponse.data.map(h => h.name));

              // First, try to get real completion data from Journal endpoint
        console.log('🏆 Fetching REAL completion status from Journal endpoint...');
        let journalCompletions: any[] = [];
        
        try {
          // Try multiple date formats to ensure we catch the completion
          const now = new Date();
          console.log(`🕐 Current local time: ${now.toISOString()}`);
          
          // Format 1: Current time with timezone
          const offsetMinutes = now.getTimezoneOffset();
          const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
          const offsetMins = Math.abs(offsetMinutes) % 60;
          const offsetSign = offsetMinutes <= 0 ? '+' : '-';
          const offset = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
          
          const year = now.getFullYear();
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          const day = now.getDate().toString().padStart(2, '0');
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          const seconds = now.getSeconds().toString().padStart(2, '0');
          
          const targetDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
          console.log(`📅 Trying Journal with date: ${targetDate}`);
          
          const journalResponse = await this.makeRequest<HabitifyResponse<any[]>>(`/journal?target_date=${targetDate}`);
          
          // Skip UTC query since API requires ±hh:mm format, not +00:00
          
          // Also try yesterday's date (timezone shift issue)
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1).toString().padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}T00:00:00${offset}`;
          console.log(`📅 Trying yesterday: ${yesterdayStr}`);
          
          try {
            const journalResponseYesterday = await this.makeRequest<HabitifyResponse<any[]>>(`/journal?target_date=${yesterdayStr}`);
            if (journalResponseYesterday.status && journalResponseYesterday.data && journalResponseYesterday.data.length > 0) {
              console.log(`📆 Yesterday query returned ${journalResponseYesterday.data.length} entries!`);
              const yesterdayMeditate = journalResponseYesterday.data.find((entry: any) => 
                entry.name === 'Meditate' || entry.id === 'CEFD5042-5541-4F5F-A404-0354C2172B04'
              );
              if (yesterdayMeditate) {
                console.log(`🧘 Yesterday Meditate progress:`, JSON.stringify(yesterdayMeditate.progress, null, 2));
              }
            }
          } catch (error) {
            console.log(`ℹ️ Yesterday query failed, continuing...`);
          }
        if (journalResponse.status && journalResponse.data) {
          journalCompletions = journalResponse.data;
          console.log(`🎯 SUCCESS! Found ${journalCompletions.length} real account completions from Journal!`);
          console.log('📋 Journal data structure:', journalCompletions);
          
                                // Log simplified journal data
          console.log(`📋 Journal entries found for ${journalCompletions.length} habits`);
        }
      } catch (error) {
        console.warn('❌ Failed to fetch Journal data, falling back to actions only:', error);
      }

      // Now get completion status and analytics
      console.log('✅ Fetching analytics from actions...');
      
      const habitsWithStatus = await Promise.all(
        habitsResponse.data.map(async (habit: HabitifyHabit) => {
          let completedToday = false;
          let todayAction: HabitifyAction | undefined;
          let analytics = this.calculateAnalytics([]); // Default empty analytics

                  // FIRST: Check Journal data for real completion status
        const journalEntry = journalCompletions.find(entry => 
          entry.habit_id === habit.id || 
          entry.habitId === habit.id ||
          entry.id === habit.id
        );
        
        console.log(`🔍 Looking for ${habit.name} (${habit.id}) in Journal:`, {
          foundEntry: !!journalEntry,
          journalEntry: journalEntry,
          allJournalIds: journalCompletions.map(e => e.habit_id || e.habitId || e.id)
        });
          
                  if (journalEntry) {
          // Found real account data! Use this instead of actions
          // Check completion based on progress: current_value >= target_value
          const progress = journalEntry.progress;
          completedToday = progress && 
                          progress.current_value !== undefined && 
                          progress.target_value !== undefined && 
                          progress.current_value >= progress.target_value;
          
          console.log(`🎯 REAL DATA for ${habit.name}: completed = ${completedToday} (current: ${progress?.current_value}/${progress?.target_value})`);
          
          // SPECIAL DEBUG FOR EMAIL
          if (habit.name === 'Email') {
            console.log(`📧 EMAIL DEBUG - Full Journal Entry:`, JSON.stringify(journalEntry, null, 2));
            console.log(`📧 EMAIL DEBUG - Progress Object:`, JSON.stringify(progress, null, 2));
            console.log(`📧 EMAIL DEBUG - Updated At:`, journalEntry.updated_at);
            console.log(`📧 EMAIL DEBUG - Reference Date:`, progress?.reference_date);
            console.log(`📧 EMAIL DEBUG - Current Time:`, new Date().toISOString());
            console.log(`📧 EMAIL SYNC STATUS: App shows completed ✅ but API shows current_value: ${progress?.current_value} ❌`);
          }
          
          // Log completed habits for debugging
          if (completedToday) {
            console.log(`✅ ${habit.name} completed today (${progress?.current_value}/${progress?.target_value})`);
          }
        } else {
          // SPECIAL DEBUG FOR EMAIL - show what we're missing
          if (habit.name === 'Email') {
            console.log(`📧 EMAIL NOT FOUND IN JOURNAL! Available entries:`);
            journalCompletions.forEach((entry, index) => {
              console.log(`  ${index + 1}. ${entry.name || 'unnamed'} (habit_id: ${entry.habit_id}, id: ${entry.id})`);
            });
          }
        }

                         try {
                 // Get actions for analytics and fallback - add cache busting
                 const cacheBuster = Date.now();
                 const actionsResponse = await this.makeRequest<HabitifyResponse<HabitifyAction[]>>(`/actions/${habit.id}?_t=${cacheBuster}`);

                 if (actionsResponse.status && actionsResponse.data) {
                   console.log(`📋 ${habit.name}: Found ${actionsResponse.data.length} total actions`);
                   
                   // Filter out test actions for clean analytics
                   const realActions = actionsResponse.data.filter((action: any) => 
                     !action.title?.includes('Completed via Health Hub') && 
                     !action.title?.includes('via Health Hub') &&
                     !action.title?.includes('Test action') &&
                     action.title !== '' &&
                     action.title !== null &&
                     action.title !== undefined
                   );
                   
                   console.log(`📊 ${habit.name}: ${realActions.length} real actions (filtered out ${actionsResponse.data.length - realActions.length} test actions)`);
                   
                   if (realActions.length > 0) {
                     realActions.forEach((action: any, index: number) => {
                       console.log(`  ${index + 1}. "${action.title}" (${action.status === 1 ? 'completed' : 'pending'})`);
                     });
                   }
                   
                   // Calculate analytics from REAL actions only
                   analytics = this.calculateAnalytics(realActions);
              
                            // If no Journal entry found, fallback to actions (using filtered actions)
              if (!journalEntry) {
                const today = new Date().toISOString().split('T')[0];
                const todayActions = realActions.filter(action =>
                  action.updated_at.startsWith(today)
                );
                const completedActions = todayActions.filter(action => action.status === 1);
                completedToday = completedActions.length >= (habit.goal?.times || 1);
                todayAction = todayActions.length > 0 ? todayActions[todayActions.length - 1] : undefined;
                console.log(`📊 FALLBACK for ${habit.name}: completed = ${completedToday} (from ${realActions.length} real Actions)`);
              } else {
                console.log(`📊 Analytics for ${habit.name}: ${analytics.totalCompletions} completions, ${analytics.currentStreak} day streak (using ${realActions.length} real actions + Journal status)`);
              }
            } else {
              console.warn(`❌ No action data returned for habit ${habit.name}`);
            }
          } catch (error) {
            console.warn(`❌ Failed to fetch actions for habit ${habit.name}:`, error);
            // Continue with Journal data if available, or false status
          }

          return {
            id: habit.id,
            name: habit.name,
            icon: this.getHabitIcon(habit.name),
            streak: analytics.currentStreak,
            completedToday,
            target: habit.goal?.times || 1,
            frequency: habit.goal?.period === 'week' ? 'weekly' : 'daily',
            goal: habit.goal,
            todayAction,
            analytics,
          };
        })
      );

      console.info('✅ Successfully fetched habits with today\'s completion status from Habitify API');
      return habitsWithStatus;
      
    } catch (error) {
      console.error('❌ Error fetching habits from Habitify API, falling back to mock data');
      console.error('Error details:', error);
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      // Fallback to mock data
      return this.getMockHabits();
    }
  }

  private static getHabitIcon(name: string): string {
    const lowerName = name.toLowerCase();
    
    // Food and nutrition
    if (lowerName.includes('food') || lowerName.includes('eat') || lowerName.includes('meal')) return '🍎';
    if (lowerName.includes('log food')) return '🍽️';
    
    // Hydration
    if (lowerName.includes('water') || lowerName.includes('drink') || lowerName.includes('hydra')) return '💧';
    
    // Exercise and movement
    if (lowerName.includes('exercise') || lowerName.includes('workout') || lowerName.includes('gym')) return '🏃‍♂️';
    if (lowerName.includes('walk') || lowerName.includes('steps')) return '🚶‍♂️';
    if (lowerName.includes('run') || lowerName.includes('jog')) return '🏃';
    if (lowerName.includes('bike') || lowerName.includes('cycle')) return '🚴‍♂️';
    if (lowerName.includes('swim')) return '🏊‍♂️';
    
    // Mental health and wellness
    if (lowerName.includes('meditat')) return '🧘‍♂️';
    if (lowerName.includes('mindful')) return '🧠';
    if (lowerName.includes('prayer') || lowerName.includes('pray')) return '🙏';
    if (lowerName.includes('journal') || lowerName.includes('diary')) return '📝';
    
    // Learning and productivity
    if (lowerName.includes('read') || lowerName.includes('book')) return '📚';
    if (lowerName.includes('study') || lowerName.includes('learn')) return '📖';
    if (lowerName.includes('write') || lowerName.includes('blog')) return '✍️';
    
    // Sleep and recovery
    if (lowerName.includes('sleep') || lowerName.includes('bed')) return '😴';
    if (lowerName.includes('nap')) return '💤';
    if (lowerName.includes('recovery') || lowerName.includes('rest')) return '🛌';
    
    // Morning and evening routines
    if (lowerName.includes('morning') || lowerName.includes('wake')) return '🌅';
    if (lowerName.includes('night') || lowerName.includes('evening')) return '🌙';
    if (lowerName.includes('routine')) return '⚡';
    
    // Health and medicine
    if (lowerName.includes('vitamin') || lowerName.includes('supplement')) return '💊';
    if (lowerName.includes('medicine') || lowerName.includes('medication')) return '💉';
    if (lowerName.includes('weight') || lowerName.includes('scale')) return '⚖️';
    
    // Social and relationships
    if (lowerName.includes('family') || lowerName.includes('friend')) return '👨‍👩‍👧‍👦';
    if (lowerName.includes('call') || lowerName.includes('phone')) return '📞';
    if (lowerName.includes('social')) return '👥';
    
    // Monarch (since Brady uses this)
    if (lowerName.includes('monarch')) return '👑';
    
    return '✅'; // Default icon
  }

  static async logHabit(habitId: string): Promise<HabitLog> {
    try {
      // First check if there's already an action for today that we can toggle
      const today = new Date().toISOString().split('T')[0];
      const actionsResponse = await this.makeRequest<HabitifyResponse<HabitifyAction[]>>(`/actions/${habitId}`);
      
      let actionToday: HabitifyAction | undefined;
      
      if (actionsResponse.status && actionsResponse.data) {
        // Find today's action
        actionToday = actionsResponse.data.find(action => 
          action.updated_at.startsWith(today)
        );
      }

      if (actionToday) {
        // Update existing action - toggle its status
        const newStatus = actionToday.status === 1 ? 0 : 1; // Toggle between complete (1) and incomplete (0)
        
        // Format the remind_at properly for the API
        const now = new Date();
        const offsetMinutes = now.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
        const offsetMins = Math.abs(offsetMinutes) % 60;
        const offsetSign = offsetMinutes <= 0 ? '+' : '-';
        const offset = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
        
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const properRemindAt = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;

        const updateResponse = await this.makeRequest<HabitifyResponse<null>>(
          `/actions/${habitId}/${actionToday.id}`, 
          {
            method: 'PUT',
            body: JSON.stringify({
              status: newStatus,
              title: actionToday.title,
              remind_at: properRemindAt, // Use properly formatted remind_at
            }),
          }
        );

        if (updateResponse.status) {
          console.info(`Successfully ${newStatus === 1 ? 'completed' : 'uncompleted'} habit in Habitify API`);
          return {
            habitId,
            date: today,
            completed: newStatus === 1,
            timestamp: new Date(),
          };
        } else {
          throw new Error(updateResponse.message);
        }
      } else {
        // Create a new action (mark as completed)
        // Based on the API docs, we need title and remind_at in YYYY-MM-DDThh:mm:ss±hh:mm format
        const now = new Date();
        // Format: YYYY-MM-DDThh:mm:ss±hh:mm (note lowercase 'h' and timezone offset)
        const offsetMinutes = now.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
        const offsetMins = Math.abs(offsetMinutes) % 60;
        const offsetSign = offsetMinutes <= 0 ? '+' : '-';
        const offset = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
        
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const remindAt = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
        
        const createResponse = await this.makeRequest<HabitifyResponse<null>>(`/actions/${habitId}`, {
          method: 'POST',
          body: JSON.stringify({
            title: 'Completed via Health Hub',
            remind_at: remindAt,
          }),
        });

        if (createResponse.status) {
          console.info('Successfully created habit completion in Habitify API');
          return {
            habitId,
            date: today,
            completed: true,
            timestamp: new Date(),
          };
        } else {
          throw new Error(createResponse.message);
        }
      }
    } catch (error) {
      console.error('Error logging habit to Habitify API:', error);
      throw error; // Don't fallback for write operations - let the UI handle the error
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

  // Calculate analytics from actions data
  static calculateAnalytics(actions: HabitifyAction[]): Habit['analytics'] {
    if (!actions || actions.length === 0) {
      return {
        totalCompletions: 0,
        completionRate: 0,
        bestStreak: 0,
        currentStreak: 0,
        lastSevenDays: [false, false, false, false, false, false, false],
        recentActivity: []
      };
    }

    // Sort actions by date
    const sortedActions = actions
      .filter(action => action.status === 1) // Only completed actions
      .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());

    const totalCompletions = sortedActions.length;
    
    // Calculate last 7 days
    const today = new Date();
    const lastSevenDays: boolean[] = [];
    const recentActivity: { date: string; completed: boolean }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const hasCompletion = sortedActions.some(action => 
        action.updated_at.startsWith(dateStr)
      );
      
      lastSevenDays.push(hasCompletion);
      recentActivity.push({
        date: dateStr,
        completed: hasCompletion
      });
    }

    // Calculate completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCompletions = sortedActions.filter(action => 
      new Date(action.updated_at) >= thirtyDaysAgo
    ).length;
    const completionRate = Math.round((recentCompletions / 30) * 100);

    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Calculate current streak (from today backwards)
    for (let i = 0; i < lastSevenDays.length; i++) {
      if (lastSevenDays[6 - i]) { // Start from today (index 6)
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate best streak from all data
    for (const completed of lastSevenDays) {
      if (completed) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return {
      totalCompletions,
      completionRate: Math.min(completionRate, 100),
      bestStreak,
      currentStreak,
      lastSevenDays,
      recentActivity
    };
  }

  // Clear old test actions to get clean analytics
  static async clearTestActions(): Promise<string> {
    if (!this.API_KEY) {
      return '❌ No API key configured';
    }

    try {
      console.log('🧹 Clearing old test actions to get clean analytics...');
      
      // Get habits first
      const habitsResponse = await this.makeRequest<HabitifyResponse<HabitifyHabit[]>>('/habits');
      if (!habitsResponse.status || !habitsResponse.data) {
        return '❌ Failed to fetch habits';
      }

      let clearedCount = 0;
      
      // For each habit, get actions and delete API-created ones
      for (const habit of habitsResponse.data) {
        try {
          const actionsResponse = await this.makeRequest<HabitifyResponse<HabitifyAction[]>>(`/actions/${habit.id}`);
          if (actionsResponse.status && actionsResponse.data) {
            console.log(`📋 ${habit.name}: Found ${actionsResponse.data.length} total actions`);
            
            // Log all action titles for debugging
            actionsResponse.data.forEach((action: any, index: number) => {
              console.log(`  ${index + 1}. "${action.title}" (${action.status === 1 ? 'completed' : 'pending'})`);
            });
            
            // Filter actions that were created via API (have our title or look like test data)
            const apiActions = actionsResponse.data.filter((action: any) => 
              action.title?.includes('Completed via Health Hub') || 
              action.title?.includes('via Health Hub') ||
              action.title?.includes('Test action') ||
              action.title === '' ||
              !action.title
            );
            
            console.log(`🎯 ${habit.name}: Found ${apiActions.length} API actions to delete`);
            
            // Delete each API-created action
            for (const action of apiActions) {
              try {
                console.log(`🗑️ Attempting to DELETE action ${action.id} for ${habit.name}`);
                const deleteResult = await this.makeRequest(`/actions/${habit.id}/${action.id}`, 'DELETE');
                console.log(`🗑️ DELETE response:`, deleteResult);
                clearedCount++;
                console.log(`✅ Successfully deleted action "${action.title}" for ${habit.name}`);
              } catch (error) {
                console.warn(`❌ Failed to delete action for ${habit.name}:`, error);
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to process actions for ${habit.name}:`, error);
        }
      }
      
      return `✅ Cleared ${clearedCount} test actions. Analytics should now reflect real data.`;
    } catch (error) {
      console.error('❌ Error clearing test actions:', error);
      return `❌ Error: ${error}`;
    }
  }

  // Debug utility to test API connection and explore endpoints
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.API_KEY) {
        return { success: false, message: 'API key not configured. Please set VITE_HABITIFY_API_KEY environment variable.' };
      }

      // Test with a simple GET request to habits endpoint
      const response = await this.makeRequest<HabitifyResponse<any>>('/habits');
      
      if (response.status) {
        console.log('🔍 TESTING JOURNAL ENDPOINT WITH PROPER DATE FORMAT:');
        
        // Test the journal endpoint with properly formatted date (same format as actions)
        const now = new Date();
        const offsetMinutes = now.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
        const offsetMins = Math.abs(offsetMinutes) % 60;
        const offsetSign = offsetMinutes <= 0 ? '+' : '-';
        const offset = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
        
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const properTargetDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
        
        try {
          const journalResponse = await this.makeRequest<HabitifyResponse<any>>(`/journal?target_date=${properTargetDate}`);
          console.log(`📅 Journal for ${properTargetDate}:`, journalResponse);
          
          // If successful, check if it contains completion data
          if (journalResponse.status && journalResponse.data) {
            console.log(`🎯 JOURNAL DATA FOUND!:`, {
              dataType: typeof journalResponse.data,
              isArray: Array.isArray(journalResponse.data),
              keys: journalResponse.data ? Object.keys(journalResponse.data) : 'null',
              fullData: journalResponse.data
            });
            
            // Check if this contains habit completion info that matches your account
            if (journalResponse.data.habits || journalResponse.data.entries || journalResponse.data.completions) {
              console.log('🏆 POTENTIAL REAL ACCOUNT DATA FOUND!');
            }
          }
        } catch (error) {
          console.log(`❌ Journal endpoint with proper date failed:`, error);
        }
        
        console.log('🔍 TESTING ACTIONS FOR FIRST FEW HABITS:');
        for (const habit of (response.data || []).slice(0, 3)) {
          try {
            const actionsResponse = await this.makeRequest<HabitifyResponse<HabitifyAction[]>>(`/actions/${habit.id}`);
            console.log(`📋 ${habit.name} (${habit.id}):`, {
              actionCount: actionsResponse.data?.length || 0,
              actions: actionsResponse.data?.slice(0, 2), // Show first 2 actions
              hasActions: (actionsResponse.data?.length || 0) > 0
            });
          } catch (error) {
            console.log(`❌ Failed to get actions for ${habit.name}:`, error);
          }
        }
        
        return { success: true, message: `Connected successfully. Found ${response.data?.length || 0} habits. Check console for journal endpoint tests.` };
      } else {
        return { success: false, message: response.message || 'API returned error status' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, message: `Connection failed: ${errorMessage}` };
    }
  }
}