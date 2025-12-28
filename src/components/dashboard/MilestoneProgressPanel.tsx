import { motion } from 'framer-motion';
import { Target, WifiOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useWeightData } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';

// Demo mode: Generic milestones without personal details
const demoMilestoneRewards = [
  { weight: 205, date: 'Week 4', reward: 'Milestone Reward 1', cost: '$75' },
  { weight: 200, date: 'Week 8', reward: 'Milestone Reward 2', cost: '$150' },
  { weight: 195, date: 'Week 12', reward: 'Milestone Reward 3', cost: '$220' },
  { weight: 190, date: 'Week 16', reward: 'Milestone Reward 4', cost: '$350' },
  { weight: 185, date: 'Week 20', reward: 'Final Goal Reward', cost: '$530' },
];

// Personal milestones (only shown when authenticated)
const personalMilestoneRewards = [
  { weight: 205, date: 'Aug 1', reward: 'Top Golf date night', cost: '$75' },
  { weight: 200, date: 'Aug 24', reward: 'Concert (Lil Wayne 9/16) or Texas Longhorns home game', cost: '$150' },
  { weight: 195, date: 'Sep 17', reward: 'Couples 90-min massage at Viva Day Spa', cost: '$220' },
  { weight: 190, date: 'Oct 10', reward: 'Smart lighting & audio upgrade', cost: '$350' },
  { weight: 185, date: 'Nov 1', reward: 'Office refresh (rug, futon, table)', cost: '$530' },
];

export function MilestoneProgressPanel() {
  const { user } = useAuth();
  const { data: weightData } = useWeightData(30);
  
  // Use demo milestones if not authenticated
  const milestoneRewards = user ? personalMilestoneRewards : demoMilestoneRewards;
  
  // Use mock weight for demo mode
  const currentWeight = user 
    ? (weightData?.[weightData.length - 1]?.weight || 212)
    : 195; // Demo weight showing progress

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card className="relative flex flex-col h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Milestone Progress
            </CardTitle>
            {!user && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400 whitespace-nowrap">
                <WifiOff className="h-3 w-3 mr-1" />
                Demo Mode
              </Badge>
            )}
          </div>
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

