import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Edit, Save, X, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useAuth } from '@/contexts/AuthContext';
import { TextCardService } from '@/services/textCardService';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface TextCardProps {
  id: string;
  title?: string;
  description?: string;
  initialContent?: string;
  onDelete?: (id: string) => void;
  icon?: React.ComponentType<{ className?: string }>;
  size?: 'small' | 'medium' | 'large';
}

export function TextCard({ 
  id, 
  title = 'Text Card', 
  description = 'Custom text content',
  initialContent = '<p>Start typing your content here...</p>',
  onDelete,
  icon: Icon = FileText,
  size = 'medium'
}: TextCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [tempContent, setTempContent] = useState(content);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  const handleEdit = () => {
    setTempContent(content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const page = TextCardService.getPageFromLocation(location.pathname);
      await TextCardService.saveTextCard(user.id, id, {
        title,
        description,
        content: tempContent,
        page
      });
      
      setContent(tempContent);
      setLastUpdated(new Date());
      setIsEditing(false);
      
      toast({
        title: "Saved",
        description: "Text card saved successfully",
      });
    } catch (error) {
      console.error('Error saving text card:', error);
      toast({
        title: "Error",
        description: "Failed to save text card",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTempContent(content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!onDelete || !user) return;
    
    if (window.confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      try {
        const page = TextCardService.getPageFromLocation(location.pathname);
        await TextCardService.deleteTextCard(user.id, id, page);
        onDelete(id);
        
        toast({
          title: "Deleted",
          description: "Text card deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting text card:', error);
        toast({
          title: "Error",
          description: "Failed to delete text card",
          variant: "destructive",
        });
      }
    }
  };

  // Load existing content on mount
  useEffect(() => {
    const loadExistingContent = async () => {
      if (!user || !TextCardService.isTextCard(id)) return;
      
      try {
        const page = TextCardService.getPageFromLocation(location.pathname);
        const existingCard = await TextCardService.loadTextCard(user.id, id, page);
        
        if (existingCard) {
          setContent(existingCard.content);
          setTempContent(existingCard.content);
          setLastUpdated(existingCard.updatedAt);
        }
      } catch (error) {
        console.error('Error loading existing text card:', error);
      }
    };

    loadExistingContent();
  }, [user, id, location.pathname]);

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-accent" />
            <CardTitle>{title}</CardTitle>
          </div>
          {lastUpdated && (
            <Badge variant="outline" className="text-xs">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
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
              placeholder="Enter your content..."
              minHeight="150px"
              compact={size === 'small'}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rich-text-content text-sm max-w-none"
            style={{ lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </CardContent>
      
      {/* Edit buttons positioned in top right of card header area */}
      {user?.role === 'admin' && !isEditing && (
        <div className="absolute top-16 right-2 flex gap-1 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm border shadow-sm"
          >
            <Edit className="h-3 w-3" />
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm border shadow-sm text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
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
