import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Calendar, Edit, Save, X, Dumbbell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useWeightData } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';

const initialWeightLossGoal = `<h2><strong>Weight Loss Plan – July 9 to Nov 1, 2025</strong></h2>

<p><strong>Goal:</strong> Drop from <strong>210 lbs to 185 lbs</strong> in 17 weeks (116 days) at a pace of <strong>~1.5 lbs/week</strong>, focusing on fat loss while maintaining strength and performance through CrossFit and recovery training.</p>

<h3><strong>Plan Summary</strong></h3>
<ul>
<li>Start: July 9</li>
<li>End: November 1</li>
<li>Total weight loss goal: 25 lbs</li>
<li>Calorie baseline: <strong>1,700 kcal/day</strong></li>
<li>Workout days: Add back <strong>500–800 kcal</strong> (~2,200–2,500 total)</li>
<li>Weekend strategy: Cycle 1,750 kcal on weekdays, 1,600 kcal on weekends to average ~1,700 kcal/day</li>
</ul>

<h3><strong>Adjustment Rules</strong></h3>
<ul>
<li>If losing more than 2 lbs/week → increase intake to 1,800 kcal</li>
<li>If losing less than 1 lb/week for 2+ weeks → decrease to 1,650 kcal</li>
</ul>`;

const initialChallengeGoal = `<h2><strong>30-Day Mile + Bodyweight Challenge</strong></h2>

<p><span style="color: #f59e0b;">🎯</span> <strong>Goal:</strong> Maintain CrossFit 5–6x/week while adding a <strong>daily 1-mile run</strong> + <strong>50 push-ups</strong> + core work for 30 days.</p>

<h3><span style="color: #3b82f6;">📌</span> <strong>Rules & Tracking</strong></h3>
<ul>
<li><strong>Run:</strong> 1 mile (easy/moderate pace most days, 1–2 faster efforts/week)</li>
<li><strong>Bodyweight:</strong> 50 push-ups + core variation of the day</li>
<li><strong>Apple Watch:</strong> <em>Outdoor Run</em> → mile tracking, <em>Functional Strength Training</em> → push-ups + core</li>
<li><strong>Nutrition:</strong> ≤1,700 calories/day net (add back calories for workouts >250 kcal)</li>
</ul>

<h3><span style="color: #10b981;">💡</span> <strong>Tips for Success</strong></h3>
<ul>
<li>Keep 80–90% of runs at conversational pace</li>
<li>Break push-ups into sets (e.g., 20-15-15) to keep form strong</li>
<li>Rotate core work to avoid hip flexor fatigue</li>
<li>On heavy CrossFit days, keep the mile easy and core work low-intensity</li>
</ul>`;

const milestoneRewards = [
  { weight: 205, date: 'Aug 1', reward: 'Top Golf date night', cost: '$75' },
  { weight: 200, date: 'Aug 24', reward: 'Concert (Lil Wayne 9/16) or Texas Longhorns home game', cost: '$150' },
  { weight: 195, date: 'Sep 17', reward: 'Couples 90-min massage at Viva Day Spa', cost: '$220' },
  { weight: 190, date: 'Oct 10', reward: 'Smart lighting & audio upgrade', cost: '$350' },
  { weight: 185, date: 'Nov 1', reward: 'Office refresh (rug, futon, table)', cost: '$530' },
];

export function GoalsPanel() {
  const { user } = useAuth();
  const { data: weightData } = useWeightData(30);
  const currentWeight = weightData?.[weightData.length - 1]?.weight || 212;
  
  const [editingWeightLoss, setEditingWeightLoss] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(false);
  const [weightLossContent, setWeightLossContent] = useState(initialWeightLossGoal);
  const [challengeContent, setChallengeContent] = useState(initialChallengeGoal);

  const isAdmin = user?.role === 'admin';

  const handleSaveWeightLoss = () => {
    console.log('Weight Loss Content:', weightLossContent);
    // TODO: Save to Firestore
    setEditingWeightLoss(false);
  };

  const handleSaveChallenge = () => {
    // TODO: Save to Firestore
    setEditingChallenge(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className="space-y-4"
    >
      {/* Long-term Weight Loss Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Long-term Goal
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editingWeightLoss ? handleSaveWeightLoss() : setEditingWeightLoss(true)}
              >
                {editingWeightLoss ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              </Button>
            )}
          </CardTitle>
          <CardDescription>Weight loss plan with milestone rewards</CardDescription>
        </CardHeader>
        <CardContent>
          {editingWeightLoss ? (
            <div className="space-y-2">
              <RichTextEditor
                content={weightLossContent}
                onChange={setWeightLossContent}
                placeholder="Enter your weight loss plan..."
                minHeight="300px"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveWeightLoss}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingWeightLoss(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div 
              className="rich-text-content text-sm max-w-none"
              style={{ lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: weightLossContent }}
            />
          )}
        </CardContent>
      </Card>

      {/* Short-term Challenge Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-accent" />
              30-Day Challenge
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editingChallenge ? handleSaveChallenge() : setEditingChallenge(true)}
              >
                {editingChallenge ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              </Button>
            )}
          </CardTitle>
          <CardDescription>Current fitness challenge progress</CardDescription>
        </CardHeader>
        <CardContent>
          {editingChallenge ? (
            <div className="space-y-2">
              <RichTextEditor
                content={challengeContent}
                onChange={setChallengeContent}
                placeholder="Enter your 30-day challenge details..."
                minHeight="250px"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveChallenge}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingChallenge(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div 
              className="rich-text-content text-sm max-w-none"
              style={{ lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: challengeContent }}
            />
          )}
        </CardContent>
      </Card>

      {/* Milestone Progress Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Milestone Progress
          </CardTitle>
          <CardDescription>Weight loss milestones & rewards tracker</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {milestoneRewards.map((milestone, index) => {
              const isCompleted = currentWeight <= milestone.weight;
              const isNext = !isCompleted && (index === 0 || currentWeight <= milestoneRewards[index - 1].weight);
              
              return (
                <div key={milestone.weight} className={`p-3 rounded-lg border ${isCompleted ? 'bg-green-50 border-green-200' : isNext ? 'bg-accent/10 border-accent' : 'bg-muted/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className={`h-4 w-4 ${isCompleted ? 'text-green-600' : isNext ? 'text-accent' : 'text-muted-foreground'}`} />
                      <span className="font-medium">{milestone.weight} lbs</span>
                      <span className="text-xs text-muted-foreground">({milestone.date})</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{milestone.reward}</div>
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