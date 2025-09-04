import { motion } from 'framer-motion';
import { Dumbbell, Calendar, Flame, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SampleBadge } from '@/components/ui/sample-badge';
import { useWorkoutData } from '@/hooks/useData';
import { AppleHealthService } from '@/services/appleHealthService';

export function TrainingPanel() {
  const { data: workoutData, isLoading } = useWorkoutData(30);
  const lastUpdated = AppleHealthService.getLastUpdated();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-accent" />
            Training Load
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

  if (!workoutData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-accent" />
            Training Load
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load workout data</p>
        </CardContent>
      </Card>
    );
  }

  // Generate calendar data for the last 30 days
  const generateCalendarData = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const workout = workoutData.find(w => w.date === dateStr);
      days.push({
        date: dateStr,
        workout,
        isToday: dateStr === today.toISOString().split('T')[0],
      });
    }
    
    return days;
  };

  const calendarData = generateCalendarData();
  
  // Calculate stats
  const totalWorkouts = workoutData.length;
  const totalCalories = workoutData.reduce((sum, w) => sum + w.calories, 0);
  const totalMinutes = workoutData.reduce((sum, w) => sum + w.duration, 0);
  const avgRPE = workoutData.filter(w => w.rpe).reduce((sum, w) => sum + (w.rpe || 0), 0) / workoutData.filter(w => w.rpe).length;

  const getIntensityColor = (calories: number) => {
    if (calories >= 500) return 'bg-red-500';
    if (calories >= 300) return 'bg-orange-500';
    if (calories >= 150) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getIntensityOpacity = (calories: number) => {
    if (calories >= 500) return 'opacity-100';
    if (calories >= 300) return 'opacity-75';
    if (calories >= 150) return 'opacity-50';
    return 'opacity-25';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="h-full relative">
        <SampleBadge />
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-accent" />
              Training Load
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          </div>
          <CardDescription>
            30-day workout calendar heat-map
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Training Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{totalWorkouts}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Calendar className="h-3 w-3" />
                Workouts
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(totalCalories / totalWorkouts) || 0}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Flame className="h-3 w-3" />
                Avg Cal/Day
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(totalMinutes / totalWorkouts) || 0}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Avg Min/Day
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{avgRPE ? avgRPE.toFixed(1) : 'N/A'}</div>
              <div className="text-xs text-muted-foreground">
                Avg RPE
              </div>
            </div>
          </div>

          {/* Calendar Heat-map */}
          <div>
            <h4 className="text-sm font-medium mb-3">30-Day Activity Calendar</h4>
            <TooltipProvider>
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-xs text-muted-foreground text-center p-1">
                    {day}
                  </div>
                ))}
                
                {calendarData.map((day, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger>
                      <div
                        className={`
                          aspect-square rounded-sm border border-border/50 relative
                          ${day.workout 
                            ? `${getIntensityColor(day.workout.calories)} ${getIntensityOpacity(day.workout.calories)}` 
                            : 'bg-muted/30'
                          }
                          ${day.isToday ? 'ring-2 ring-accent' : ''}
                          hover:ring-1 hover:ring-accent/50 transition-all
                        `}
                      >
                        {day.workout && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-xs font-medium text-white mix-blend-difference">
                              {Math.floor(day.workout.calories / 100)}
                            </div>
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <div className="font-medium">
                          {new Date(day.date).toLocaleDateString([], { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        {day.workout ? (
                          <div className="space-y-1 text-xs">
                            <div>{day.workout.type}</div>
                            <div>{day.workout.duration} min • {day.workout.calories} cal</div>
                            {day.workout.rpe && <div>RPE: {day.workout.rpe}/10</div>}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Rest day</div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
            
            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-muted/30 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-500 opacity-25 rounded-sm"></div>
                <div className="w-3 h-3 bg-yellow-500 opacity-50 rounded-sm"></div>
                <div className="w-3 h-3 bg-orange-500 opacity-75 rounded-sm"></div>
                <div className="w-3 h-3 bg-red-500 opacity-100 rounded-sm"></div>
              </div>
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}