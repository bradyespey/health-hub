import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Flame } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useHabits } from '@/hooks/useData';
import { HabitifyService } from '@/services/habitifyService';

export function HabitsPanel() {
  const { data: habits, isLoading, mutate } = useHabits();
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggleHabit = async (habitId: string) => {
    setLoading(habitId);
    try {
      await HabitifyService.logHabit(habitId);
      mutate(); // Refresh data
    } finally {
      setLoading(null);
    }
  };

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
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-accent" />
            Habits
          </CardTitle>
          <CardDescription>Track daily habits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {habits?.map((habit) => (
              <div key={habit.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={habit.completedToday}
                    onCheckedChange={() => handleToggleHabit(habit.id)}
                    disabled={loading === habit.id}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{habit.icon}</span>
                      <span className="font-medium">{habit.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    {habit.streak}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}