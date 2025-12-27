import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Edit, Save, X, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useAuth } from '@/contexts/AuthContext';
import { TextCardService, type TextCardData } from '@/services/textCardService';
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
  pageOverride?: string;
}

export function TextCard({ 
  id, 
  title = 'Text Card', 
  description = 'Custom text content',
  initialContent = '<p>Start typing your content here...</p>',
  onDelete,
  icon: Icon = FileText,
  size = 'medium',
  pageOverride
}: TextCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [tempContent, setTempContent] = useState(content);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const effectivePage = useMemo(
    () => pageOverride || TextCardService.getPageFromLocation(location.pathname),
    [pageOverride, location.pathname]
  );

  const handleEdit = () => {
    setTempContent(content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await TextCardService.saveTextCard(user.id, id, {
        title,
        description,
        content: tempContent,
        page: effectivePage
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
        await TextCardService.deleteTextCard(user.id, id, effectivePage);
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
        const existingCard = await TextCardService.loadTextCard(user.id, id, effectivePage);
        
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
  }, [user, id, effectivePage]);

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-accent" />
              <CardTitle className="truncate">{title}</CardTitle>
            </div>
            <CardDescription className="truncate">{description}</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {lastUpdated && (
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Badge>
            )}

            {user?.role === 'admin' && !isEditing && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-8 w-8 p-0"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {user?.role === 'admin' && isEditing && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-8 w-8 p-0"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={loading}
                  className="h-8 w-8 p-0"
                  title="Save"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
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
    </Card>
  );
}

export function PageNotes({
  page,
  title = 'Notes',
  description = 'Editable notes for this page'
}: {
  page: string;
  title?: string;
  description?: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const resolvedPage = useMemo(() => page || TextCardService.getPageFromLocation(location.pathname), [page, location.pathname]);
  const isAllPages = resolvedPage === 'all';

  const [cards, setCards] = useState<TextCardData[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!user?.id) {
      setCards([]);
      return;
    }
    setLoading(true);
    try {
      const loaded = isAllPages
        ? await TextCardService.loadAllTextCards(user.id)
        : await TextCardService.loadTextCardsForPage(user.id, resolvedPage);
      // Stable order: newest first (by updatedAt)
      loaded.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setCards(loaded);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, resolvedPage]);

  const handleAddNote = async () => {
    if (!user?.id) return;
    const newId = `text-card-${Date.now()}`;
    try {
      const pageForAdd = isAllPages ? 'dashboard' : resolvedPage;
      await TextCardService.saveTextCard(user.id, newId, {
        title: 'Note',
        description: 'Quick note',
        content: '<p>Write your note here...</p>',
        page: pageForAdd
      });
      await refresh();
      toast({ title: 'Created', description: 'New note added' });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' });
    }
  };

  return (
    <section className="mt-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {user?.role === 'admin' && (
          <Button variant="outline" size="sm" onClick={handleAddNote}>
            Add Note
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {loading && (
          <div className="text-sm text-muted-foreground">Loading notes…</div>
        )}

        {!loading && cards.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No notes yet.
          </div>
        )}

        {cards.map((c) => (
          <TextCard
            key={c.id}
            id={c.id}
            title={c.title || 'Note'}
            description={
              isAllPages
                ? `${c.page} • ${c.description || 'Quick note'}`
                : (c.description || 'Quick note')
            }
            initialContent={c.content || '<p>Write your note here...</p>'}
            size="large"
            pageOverride={c.page}
            onDelete={(id) => setCards((prev) => prev.filter((p) => p.id !== id))}
          />
        ))}
      </div>
    </section>
  );
}
