import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Edit, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useAuth } from '@/contexts/AuthContext';

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

export function ChallengeCard() {
  const [isEditing, setIsEditing] = useState(false);
  const [challengeContent, setChallengeContent] = useState(initialChallengeGoal);
  const [tempContent, setTempContent] = useState(challengeContent);
  const { user } = useAuth();

  const handleEdit = () => {
    setTempContent(challengeContent);
    setIsEditing(true);
  };

  const handleSave = () => {
    setChallengeContent(tempContent);
    setIsEditing(false);
    // TODO: Save to Firestore
  };

  const handleCancel = () => {
    setTempContent(challengeContent);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-accent" />
            <CardTitle>30-Day Challenge</CardTitle>
          </div>
          {user?.role === 'admin' && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                className="h-8 w-8 p-0"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <CardDescription>Current fitness challenge progress</CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <RichTextEditor
              content={tempContent}
              onChange={setTempContent}
              placeholder="Enter your challenge details..."
              minHeight="300px"
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rich-text-content text-sm max-w-none"
            style={{ lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{ __html: challengeContent }}
          />
        )}
      </CardContent>
    </Card>
  );
}
