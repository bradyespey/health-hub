import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWeightData } from '@/hooks/useData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

const milestones = [
  { weight: 205, reward: 'Top Golf date night', cost: '$75', date: 'Aug 1' },
  { weight: 200, reward: 'Concert or Texas Longhorns game', cost: '$150', date: 'Aug 24' },
  { weight: 195, reward: 'Couples 90-min massage', cost: '$220', date: 'Sep 17' },
  { weight: 190, reward: 'Smart lighting & audio upgrade', cost: '$350', date: 'Oct 10' },
  { weight: 185, reward: 'Office refresh', cost: '$530', date: 'Nov 1' },
];

export function Mission185Card() {
  const { data: weightData, isLoading } = useWeightData(120); // Get ~4 months of data
  
  const currentWeight = weightData && weightData.length > 0 
    ? weightData[weightData.length - 1].weight 
    : 205;

  const startWeight = 210;
  const targetWeight = 185;
  const weightLost = startWeight - currentWeight;
  const remainingWeight = currentWeight - targetWeight;
  const progressPercent = ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100;

  // Format data for chart - only show data points where we have actual data
  const chartData = weightData?.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: d.weight,
    fullDate: d.date,
  })) || [];

  // Get next milestone
  const nextMilestone = milestones.find(m => m.weight < currentWeight);

  return (
    <Card className="relative flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            <CardTitle>Mission 185</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {Math.round(progressPercent)}% Complete
          </Badge>
        </div>
        <CardDescription>210 lbs → 185 lbs | July 9 - Nov 1, 2025</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-y-auto">
        {/* Current Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">{currentWeight}</p>
            <p className="text-xs text-muted-foreground">Current</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">-{weightLost.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Lost</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">{remainingWeight.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">To Go</p>
          </div>
        </div>

        {/* Weight Progress Chart */}
        <div className="w-full h-48 sm:h-64 flex-shrink-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Loading weight data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis 
                  domain={[180, 215]} 
                  tick={{ fontSize: 11 }}
                  label={{ value: 'lbs', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value} lbs`, 'Weight']}
                />
                
                {/* Goal line */}
                <ReferenceLine 
                  y={185} 
                  stroke="hsl(var(--accent))" 
                  strokeDasharray="5 5" 
                  label={{ value: 'Goal: 185', fontSize: 10, fill: 'hsl(var(--accent))' }}
                />
                
                {/* Milestone markers */}
                {milestones.map((milestone) => (
                  <ReferenceLine 
                    key={milestone.weight}
                    y={milestone.weight} 
                    stroke={currentWeight < milestone.weight ? '#22c55e' : '#f59e0b'}
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                  />
                ))}
                
                {/* Actual weight line */}
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Next Milestone */}
        {nextMilestone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-accent/10 border border-accent/20"
          >
            <div className="flex items-start gap-2">
              <TrendingDown className="h-4 w-4 text-accent mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Next Milestone: {nextMilestone.weight} lbs</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {nextMilestone.reward} • {nextMilestone.cost} • Target: {nextMilestone.date}
                </p>
                <p className="text-xs text-accent font-medium mt-1">
                  {(currentWeight - nextMilestone.weight).toFixed(1)} lbs to go
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* All Milestones List */}
        <div className="space-y-2 flex-shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Reward Milestones</p>
          {milestones.map((milestone) => (
            <div 
              key={milestone.weight}
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 rounded text-xs gap-1 sm:gap-2 ${
                currentWeight < milestone.weight 
                  ? 'bg-green-500/10 text-green-700 dark:text-green-300' 
                  : 'bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold whitespace-nowrap">{milestone.weight} lbs</span>
                <span className="text-muted-foreground">•</span>
                <span className="flex-1">{milestone.reward}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{milestone.cost}</span>
                {currentWeight < milestone.weight && (
                  <Badge variant="outline" className="h-4 text-[10px] px-1">
                    ✓ Earned
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

