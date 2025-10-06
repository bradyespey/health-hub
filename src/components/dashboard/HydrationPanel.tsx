import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
// Sample badge removed - using real Apple Health data
import { useTodayHydration, useHydrationData } from '@/hooks/useData';
import { AppleHealthService } from '@/services/appleHealthService';
import { useAuth } from '@/contexts/AuthContext';

export function HydrationPanel() {
  const { user } = useAuth();
  const { data: todayData, isLoading: todayLoading } = useTodayHydration();
  const { data: weekData, isLoading: weekLoading } = useHydrationData(21); // Get 3 weeks of data
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0); // 0 = current week, 1 = previous week, etc.


  useEffect(() => {
    const fetchLastUpdated = async () => {
      // Single-user app: data stored under 'brady' userId
      const updated = await AppleHealthService.getLastUpdated('brady');
      setLastUpdated(updated);
    };
    
    if (user) {
      fetchLastUpdated();
    }
  }, [user]);

  if (todayLoading || weekLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-accent" />
            Hydration
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

  if (!todayData || !weekData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-accent" />
            Hydration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load hydration data</p>
        </CardContent>
      </Card>
    );
  }

  // Group data into weeks (7 days each) - data is ordered from today backwards
  const weeks = [];
  for (let i = 0; i < weekData.length; i += 7) {
    const weekDataSlice = weekData.slice(i, i + 7);
    // Reverse the week data so Monday comes first (for display)
    weeks.push(weekDataSlice.reverse());
  }

  const currentWeek = weeks[selectedWeekIndex] || weeks[0];
  const isCurrentWeek = selectedWeekIndex === 0;
  
  // Calculate week date range for display
  const getWeekLabel = (weekData: any[]) => {
    if (weekData.length === 0) return 'No Data';
    const firstDate = new Date(weekData[0].date);
    const lastDate = new Date(weekData[weekData.length - 1].date);
    
    if (isCurrentWeek) {
      return 'This Week';
    }
    
    // Show date range like "Oct 1-7" or "Sep 24-30"
    const firstMonth = firstDate.toLocaleDateString([], { month: 'short' });
    const firstDay = firstDate.getDate();
    const lastMonth = lastDate.toLocaleDateString([], { month: 'short' });
    const lastDay = lastDate.getDate();
    
    if (firstMonth === lastMonth) {
      return `${firstMonth} ${firstDay}-${lastDay}`;
    } else {
      return `${firstMonth} ${firstDay} - ${lastMonth} ${lastDay}`;
    }
  };
  
  // Calculate current week's average hydration
  const currentWeekAverage = currentWeek.reduce((sum, day) => sum + (day.waterOunces / day.goalOunces) * 100, 0) / currentWeek.length;
  const daysBelow80 = currentWeek.filter(day => (day.waterOunces / day.goalOunces) * 100 < 80).length;

  const getHydrationColor = (percentage: number) => {
    if (percentage >= 100) return 'text-blue-500';
    if (percentage >= 80) return 'text-blue-400';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-blue-500';
    if (percentage >= 80) return 'bg-blue-400';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="h-full relative">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-accent" />
              Hydration
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWeekIndex(Math.min(selectedWeekIndex + 1, weeks.length - 1))}
                  disabled={selectedWeekIndex >= weeks.length - 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Badge variant="outline" className="text-xs min-w-[80px] text-center">
                  {getWeekLabel(currentWeek)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWeekIndex(Math.max(selectedWeekIndex - 1, 0))}
                  disabled={selectedWeekIndex === 0}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Badge variant="outline" className="text-xs">
                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Badge>
            </div>
          </div>
          <CardDescription>
            Water intake from Apple Health
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Week's Hydration Gauge */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  stroke="hsl(var(--accent))"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - Math.min(currentWeekAverage / 100, 1))}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-2xl font-bold ${getHydrationColor(currentWeekAverage)}`}>
                  {Math.round(currentWeekAverage)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Weekly Average
                </div>
              </div>
            </div>
          </div>

          {/* Low Hydration Warning */}
          {currentWeekAverage < 80 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
            >
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                Weekly hydration below 80% target. Consider drinking more water.
              </span>
            </motion.div>
          )}

          {/* Weekly Overview */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">7-Day Overview</h4>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">
                  {Math.round(currentWeekAverage)}%
                </div>
                <div className="text-xs text-muted-foreground">Weekly Average</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-500">
                  {daysBelow80}
                </div>
                <div className="text-xs text-muted-foreground">Days Below 80%</div>
              </div>
            </div>

            {/* Daily Progress Bars - Start with Monday */}
            <div className="space-y-2">
              {currentWeek.map((day, index) => {
                const percentage = (day.waterOunces / day.goalOunces) * 100;
                // Parse date in local timezone by adding time component
                const dayName = new Date(day.date + 'T12:00:00').toLocaleDateString([], { weekday: 'short' });
                
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 text-xs text-muted-foreground">{dayName}</div>
                    <div className="flex-1">
                      <Progress 
                        value={Math.min(percentage, 200)} 
                        className="h-2"
                      />
                    </div>
                    <div className={`w-12 text-xs text-right ${getHydrationColor(percentage)}`}>
                      {Math.round(percentage)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}