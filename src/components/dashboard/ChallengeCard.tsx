import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Edit, Save, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useAuth } from '@/contexts/AuthContext';
import { TextCardService } from '@/services/textCardService';
import { useToast } from '@/hooks/use-toast';

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleEdit = () => {
    setTempContent(challengeContent);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await TextCardService.saveTextCard(user.id, 'challenge', {
        title: '30-Day Challenge',
        description: 'Current fitness challenge progress',
        content: tempContent,
        page: 'goals'
      });
      
      setChallengeContent(tempContent);
      setLastUpdated(new Date());
      setIsEditing(false);
      
      toast({
        title: "Saved",
        description: "30-day challenge saved successfully",
      });
    } catch (error) {
      console.error('Error saving challenge:', error);
      toast({
        title: "Error",
        description: "Failed to save 30-day challenge",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTempContent(challengeContent);
    setIsEditing(false);
  };

  // Load existing content on mount
  useEffect(() => {
    const loadExistingContent = async () => {
      if (!user) return;
      
      try {
        const existingCard = await TextCardService.loadTextCard(user.id, 'challenge', 'goals');
        
        if (existingCard) {
          setChallengeContent(existingCard.content);
          setTempContent(existingCard.content);
          setLastUpdated(existingCard.updatedAt);
        }
      } catch (error) {
        console.error('Error loading challenge:', error);
      }
    };

    loadExistingContent();
  }, [user]);

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-accent" />
            <CardTitle>30-Day Challenge</CardTitle>
          </div>
          {lastUpdated && (
            <Badge variant="outline" className="text-xs">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          )}
        </div>
        <CardDescription>Current fitness challenge progress</CardDescription>
      </CardHeader>
      <CardContent className={isEditing ? "pb-16 max-h-96 overflow-y-auto" : "max-h-96 overflow-y-auto"}>
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
              minHeight="150px"
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
      
      {/* Edit buttons positioned in top right of card header area */}
      {user?.role === 'admin' && !isEditing && (
        <div className="absolute top-16 right-2 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm border shadow-sm"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {isEditing && (
        <div className="absolute top-16 right-2 flex gap-1 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm border shadow-sm"
          >
            <X className="h-3 w-3" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={loading}
            className="h-7 w-7 p-0 shadow-sm"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}
