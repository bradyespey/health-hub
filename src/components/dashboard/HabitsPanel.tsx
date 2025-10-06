import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Flame, Target, Calendar, Clock, Wifi, WifiOff, Bug, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useHabits } from '@/hooks/useData';
import { HabitifyService } from '@/services/habitifyService';
import { useAuth } from '@/contexts/AuthContext';

export function HabitsPanel() {
  const { data: habits, isLoading, error, mutate } = useHabits();
  const [showDebug, setShowDebug] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const { user } = useAuth();

  // Check if we're actually getting real API data
  const isUsingMockData = habits && habits.length > 0 && habits.some(h => 
    h.id === '1' || h.id === '2' || h.id === '3' || h.id === '4' || h.id === '5'
  );

  const testApiConnection = async () => {
    const result = await HabitifyService.testConnection();
    setTestResult(`${result.success ? '✅' : '❌'} ${result.message}`);
  };

  const clearTestData = async () => {
    try {
      const result = await HabitifyService.clearTestActions();
      setTestResult(result);
      // Refresh data after clearing
      mutate();
    } catch (error) {
      setTestResult(`Error: ${error}`);
    }
  };

  // Removed toggle functionality - this is now read-only analytics

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-accent" />
            Habits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-accent" />
              Habits
            </div>
                                  <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => mutate()}
                          className="h-7 text-xs"
                          title="Refresh data from Habitify API"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Refresh
                        </Button>
                        {user?.role === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDebug(!showDebug)}
                            className="h-6 w-6 p-0"
                            title="Debug Panel (Admin Only)"
                          >
                            <Bug className="h-3 w-3" />
                          </Button>
                        )}
                                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        {isUsingMockData ? (
                          <>
                            <WifiOff className="h-3 w-3 text-red-500" />
                            Mock Data
                          </>
                        ) : import.meta.env.VITE_HABITIFY_API_KEY ? (
                          <>
                            <Wifi className="h-3 w-3 text-green-500" />
                            Habitify Analytics
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-3 w-3 text-orange-500" />
                            No API Key
                          </>
                        )}
                      </Badge>
                      </div>
          </CardTitle>
          <CardDescription>
            Analytics and insights from your Habitify habits
            {!isUsingMockData && (
              <span className="block text-xs text-amber-600 dark:text-amber-400 mt-1">
                📊 Analytics from historical data • Use Habitify app for daily tracking
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showDebug && (
            <div className="mb-4 space-y-2">
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div>API Key: {import.meta.env.VITE_HABITIFY_API_KEY ? '✅ Present' : '❌ Missing'}</div>
                    <div>Using Mock Data: {isUsingMockData ? '✅ Yes' : '❌ No'}</div>
                    <div>Habits Count: {habits?.length || 0}</div>
                    <div className="text-blue-600">ℹ️ Read-only analytics from Habitify API</div>
                    <div>Error: {error ? error.toString() : 'None'}</div>
                    {testResult && <div>Test Result: {testResult}</div>}
                                                  <div className="flex gap-2">
                                <Button onClick={testApiConnection} size="sm" variant="outline">
                                  Test API Connection
                                </Button>
                                <Button onClick={clearTestData} size="sm" variant="destructive">
                                  Clear Test Data
                                </Button>
                              </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
          <div className="space-y-4">
            {habits?.map((habit) => (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4 border rounded-lg hover:border-accent/50 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{habit.icon}</span>
                      <div>
                        <h3 className="font-medium">{habit.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{habit.frequency}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={habit.streak > 0 ? "default" : "secondary"} 
                        className="flex items-center gap-1"
                      >
                        <Flame className="h-3 w-3" />
                        {habit.streak} day{habit.streak !== 1 ? 's' : ''}
                      </Badge>
                      <Badge 
                        variant={habit.completedToday ? "default" : "outline"} 
                        className="flex items-center gap-1"
                      >
                        {habit.completedToday ? (
                          <>
                            <CheckSquare className="h-3 w-3" />
                            Done Today
                          </>
                        ) : (
                          <>
                            <Calendar className="h-3 w-3" />
                            Pending
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Analytics Section */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Target className="h-3 w-3" />
                        <span>Total Completions</span>
                      </div>
                      <p className="text-sm font-medium">
                        {habit.analytics?.totalCompletions || 0} times
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Success Rate</span>
                      </div>
                      <p className="text-sm font-medium">
                        {habit.analytics?.completionRate || 0}% (30 days)
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Flame className="h-3 w-3" />
                        <span>Best Streak</span>
                      </div>
                      <p className="text-sm font-medium">
                        {habit.analytics?.bestStreak || 0} day{(habit.analytics?.bestStreak || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Last 7 Days</span>
                      </div>
                      <div className="flex gap-1">
                        {(habit.analytics?.lastSevenDays || [false, false, false, false, false, false, false]).map((completed, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              completed ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                            title={`${7 - index} days ago: ${completed ? 'Completed' : 'Missed'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar for Multi-Goal Habits */}
                  {habit.goal && habit.goal.times > 1 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Today's Progress</span>
                        <span className="font-medium">
                          {habit.completedToday ? '1' : '0'} / {habit.goal.times}
                        </span>
                      </div>
                      <Progress 
                        value={habit.completedToday ? (100 / habit.goal.times) : 0} 
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {habits?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No habits found</p>
                <p className="text-sm">Create some habits in your Habitify app to see analytics here.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}