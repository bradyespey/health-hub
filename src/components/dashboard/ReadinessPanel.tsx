import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Heart, Moon, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReadinessData } from '@/hooks/useData';
import { AthlyticService } from '@/services/athlyticService';

export function ReadinessPanel() {
  const { data: readinessData, isLoading, error } = useReadinessData(7);
  const lastUpdated = AthlyticService.getLastUpdated();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Readiness & Recovery
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

  if (error || !readinessData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Readiness & Recovery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load readiness data</p>
        </CardContent>
      </Card>
    );
  }

  const latest = readinessData[readinessData.length - 1];
  const getReadinessColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Readiness & Recovery
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          </div>
          <CardDescription>
            7-day HRV trend and today's readiness score
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Today's metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getReadinessColor(latest.readiness)}`}>
                {latest.readiness}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Zap className="h-3 w-3" />
                Readiness
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{latest.hrv}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Heart className="h-3 w-3" />
                HRV (ms)
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{latest.restingHr}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Heart className="h-3 w-3" />
                RHR (bpm)
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{latest.sleepScore}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Moon className="h-3 w-3" />
                Sleep Score
              </div>
            </div>
          </div>

          {/* HRV Trend Chart */}
          <div className="h-48">
            <h4 className="text-sm font-medium mb-2">7-Day HRV Trend</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readinessData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  className="text-xs"
                />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} className="text-xs" />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [`${value} ms`, 'HRV']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="hrv" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--accent))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}