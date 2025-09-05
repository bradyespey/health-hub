import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Edit, Save, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useAuth } from '@/contexts/AuthContext';
import { TextCardService } from '@/services/textCardService';
import { useToast } from '@/hooks/use-toast';

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

export function LongTermGoalCard() {
  const [isEditing, setIsEditing] = useState(false);
  const [goalContent, setGoalContent] = useState(initialWeightLossGoal);
  const [tempContent, setTempContent] = useState(goalContent);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleEdit = () => {
    setTempContent(goalContent);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await TextCardService.saveTextCard(user.id, 'long-term-goal', {
        title: 'Long-term Goal',
        description: 'Weight loss plan with milestone rewards',
        content: tempContent,
        page: 'goals'
      });
      
      setGoalContent(tempContent);
      setLastUpdated(new Date());
      setIsEditing(false);
      
      toast({
        title: "Saved",
        description: "Long-term goal saved successfully",
      });
    } catch (error) {
      console.error('Error saving long-term goal:', error);
      toast({
        title: "Error",
        description: "Failed to save long-term goal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTempContent(goalContent);
    setIsEditing(false);
  };

  // Load existing content on mount
  useEffect(() => {
    const loadExistingContent = async () => {
      if (!user) return;
      
      try {
        const existingCard = await TextCardService.loadTextCard(user.id, 'long-term-goal', 'goals');
        
        if (existingCard) {
          setGoalContent(existingCard.content);
          setTempContent(existingCard.content);
          setLastUpdated(existingCard.updatedAt);
        }
      } catch (error) {
        console.error('Error loading long-term goal:', error);
      }
    };

    loadExistingContent();
  }, [user]);

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            <CardTitle>Long-term Goal</CardTitle>
          </div>
          {lastUpdated && (
            <Badge variant="outline" className="text-xs">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          )}
        </div>
        <CardDescription>Weight loss plan with milestone rewards</CardDescription>
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
              placeholder="Enter your long-term goal..."
              minHeight="150px"
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rich-text-content text-sm max-w-none"
            style={{ lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{ __html: goalContent }}
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
