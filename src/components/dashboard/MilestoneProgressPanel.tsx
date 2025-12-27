import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useWeightData } from '@/hooks/useData';

const milestoneRewards = [
  { weight: 205, date: 'Aug 1', reward: 'Top Golf date night', cost: '$75' },
  { weight: 200, date: 'Aug 24', reward: 'Concert (Lil Wayne 9/16) or Texas Longhorns home game', cost: '$150' },
  { weight: 195, date: 'Sep 17', reward: 'Couples 90-min massage at Viva Day Spa', cost: '$220' },
  { weight: 190, date: 'Oct 10', reward: 'Smart lighting & audio upgrade', cost: '$350' },
  { weight: 185, date: 'Nov 1', reward: 'Office refresh (rug, futon, table)', cost: '$530' },
];

export function MilestoneProgressPanel() {
  const { data: weightData } = useWeightData(30);
  const currentWeight = weightData?.[weightData.length - 1]?.weight || 212;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card className="relative flex flex-col h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Milestone Progress
          </CardTitle>
          <CardDescription>Weight loss milestones & rewards tracker</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {milestoneRewards.map((milestone, index) => {
              const isCompleted = currentWeight <= milestone.weight;
              const isNext = !isCompleted && (index === 0 || currentWeight <= milestoneRewards[index - 1].weight);
              
              return (
                <div
                  key={milestone.weight}
                  className={`p-2 rounded-lg border ${
                    isCompleted
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                      : isNext
                        ? 'bg-accent/10 border-accent'
                        : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className={`h-4 w-4 ${isCompleted ? 'text-green-600' : isNext ? 'text-accent' : 'text-muted-foreground'}`} />
                      <span className="font-medium text-sm">{milestone.weight} lbs</span>
                      <span className="text-xs text-muted-foreground">({milestone.date})</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium leading-tight">{milestone.reward}</div>
                      <div className="text-xs text-muted-foreground">{milestone.cost}</div>
                    </div>
                    {isCompleted && <span className="text-green-600 ml-2">✓</span>}
                  </div>
                  {isNext && (
                    <div className="mt-2">
                      <Progress value={Math.max(0, (210 - currentWeight) / (210 - milestone.weight) * 100)} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.max(0, currentWeight - milestone.weight).toFixed(1)} lbs to go
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

