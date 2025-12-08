import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Apple, Target, TrendingDown, ChevronLeft, ChevronRight, WifiOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
// Sample badge removed - using real data
import { useNutritionData, useWeightData } from '@/hooks/useData';
import { AppleHealthService } from '@/services/appleHealthService';

import { useAuth } from '@/contexts/AuthContext';

export function NutritionPanel() {
  const { user } = useAuth();
  const { data: nutritionData, isLoading: nutritionLoading } = useNutritionData(7);
  const { data: weightData, isLoading: weightLoading } = useWeightData(30);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // 0 = today, 1 = yesterday, etc.

  useEffect(() => {
    const fetchLastUpdated = async () => {
      const updated = await AppleHealthService.getLastUpdated('brady');
      setLastUpdated(updated);
    };
    fetchLastUpdated();
  }, []);

  if (nutritionLoading || weightLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-accent" />
            Nutrition
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

  if (!nutritionData || !weightData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-accent" />
            Nutrition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load nutrition data</p>
        </CardContent>
      </Card>
    );
  }

  // nutritionData is ordered newest-first [today, yesterday, etc.]
  const selectedDay = nutritionData[selectedDayIndex];
  const selectedDate = new Date(selectedDay.date + 'T12:00:00');
  const isToday = selectedDayIndex === 0;
  const calorieProgress = (selectedDay.calories / selectedDay.calorieTarget) * 100;
  
  const macroData = [
    { name: 'Protein', value: selectedDay.protein * 4, color: 'hsl(var(--accent))', grams: selectedDay.protein },
    { name: 'Carbs', value: selectedDay.carbs * 4, color: 'hsl(210, 40%, 70%)', grams: selectedDay.carbs },
    { name: 'Fat', value: selectedDay.fat * 9, color: 'hsl(210, 40%, 50%)', grams: selectedDay.fat },
  ];

  // Calculate total calories from macros
  const totalMacroCalories = macroData.reduce((sum, macro) => sum + macro.value, 0);
  
  // Calculate percentages
  const macroDataWithPercentages = macroData.map(macro => ({
    ...macro,
    percentage: totalMacroCalories > 0 ? (macro.value / totalMacroCalories) * 100 : 0
  }));

  const currentWeight = weightData[weightData.length - 1]?.weight || 0;
  const startWeight = weightData[0]?.weight || 0;
  const weightLoss = startWeight - currentWeight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="h-full relative">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-accent" />
              Nutrition
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDayIndex(Math.min(selectedDayIndex + 1, nutritionData.length - 1))}
                  disabled={selectedDayIndex >= nutritionData.length - 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Badge variant="outline" className="text-xs min-w-[80px] text-center">
                  {isToday ? 'Today' : selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDayIndex(Math.max(selectedDayIndex - 1, 0))}
                  disabled={selectedDayIndex === 0}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Badge>
                {!user && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400 whitespace-nowrap">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Demo Mode
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <CardDescription>
            Daily intake vs targets and weight progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calories Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">{isToday ? 'Calories Today' : 'Calories'}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Intl.NumberFormat('en-US', { 
                  minimumFractionDigits: (selectedDay.calories % 1 !== 0) ? 1 : 0, 
                  maximumFractionDigits: 1 
                }).format(selectedDay.calories)} / {new Intl.NumberFormat('en-US').format(selectedDay.calorieTarget)} kcal
              </span>
            </div>
            <Progress value={calorieProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {calorieProgress > 100 ? `${Math.round(calorieProgress - 100)}% over target` : `${Math.round(100 - calorieProgress)}% remaining`}
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Macro Breakdown */}
            <div>
              <h4 className="text-sm font-medium mb-3">{isToday ? "Today's Macros" : 'Macros'}</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={macroDataWithPercentages}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {macroDataWithPercentages.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name) => [`${Math.round(value)} kcal`, name]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs">
                {macroDataWithPercentages.map((macro, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: macro.color }}
                    />
                    <span>
                      {macro.name}: {new Intl.NumberFormat('en-US', { 
                        minimumFractionDigits: (macro.grams % 1 !== 0) ? 1 : 0, 
                        maximumFractionDigits: 1 
                      }).format(macro.grams)}g ({Math.round(macro.percentage)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weight Trend */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Weight Progress</h4>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm">-{weightLoss.toFixed(1)} lbs</span>
                </div>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      className="text-xs"
                    />
                    <YAxis 
                      domain={['dataMin - 2', 'dataMax + 2']}
                      tickFormatter={(value) => `${value} lbs`}
                      className="text-xs"
                    />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => [`${value} lbs`, 'Weight']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}