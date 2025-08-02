import { motion } from 'framer-motion';
import { Trophy, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useWeightData } from '@/hooks/useData';

const milestones = [210, 205, 200, 195, 190, 185];

export function MilestonesPanel() {
  const { data: weightData } = useWeightData(30);
  const currentWeight = weightData?.[weightData.length - 1]?.weight || 212;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            Milestones
          </CardTitle>
          <CardDescription>Weight loss progress ladder</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone, index) => {
              const isCompleted = currentWeight <= milestone;
              const isNext = !isCompleted && (index === 0 || currentWeight <= milestones[index - 1]);
              
              return (
                <div key={milestone} className={`p-3 rounded-lg border ${isCompleted ? 'bg-green-50 border-green-200' : isNext ? 'bg-accent/10 border-accent' : 'bg-muted/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className={`h-4 w-4 ${isCompleted ? 'text-green-600' : isNext ? 'text-accent' : 'text-muted-foreground'}`} />
                      <span className="font-medium">{milestone} lbs</span>
                    </div>
                    {isCompleted && <span className="text-green-600">✓</span>}
                  </div>
                  {isNext && (
                    <div className="mt-2">
                      <Progress value={(210 - currentWeight) / (210 - milestone) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(currentWeight - milestone).toFixed(1)} lbs to go
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}