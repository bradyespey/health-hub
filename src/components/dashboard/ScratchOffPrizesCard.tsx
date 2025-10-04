import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Plus, X, Calendar, Trophy, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebaseConfig';
import { collection, addDoc, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';

const prizeCategories = [
  '5 Workouts This Week',
  'New Workout PR',
  '5 Days Under Calories',
  '5 Miles Cardio This Week',
  'No Alcohol for 7 Days',
  'Weekly Challenge Of Choice',
];

interface PrizeEntry {
  id?: string;
  category: string;
  description: string;
  completedDate: string;
  scratchedDate?: string;
  createdAt?: any;
}

export function ScratchOffPrizesCard() {
  const [isAdding, setIsAdding] = useState(false);
  const [entries, setEntries] = useState<PrizeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().split('T')[0]);
  const [scratchedDate, setScratchedDate] = useState('');

  // Load existing entries
  useEffect(() => {
    const loadEntries = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, 'users', user.id, 'scratchOffPrizes'),
          orderBy('completedDate', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const loadedEntries: PrizeEntry[] = [];
        
        querySnapshot.forEach((doc) => {
          loadedEntries.push({
            id: doc.id,
            ...doc.data() as Omit<PrizeEntry, 'id'>
          });
        });

        setEntries(loadedEntries);
      } catch (error) {
        console.error('Error loading scratch-off prizes:', error);
      }
    };

    loadEntries();
  }, [user]);

  const handleAdd = async () => {
    if (!user || !category || !description || !completedDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newEntry: PrizeEntry = {
        category,
        description,
        completedDate,
        ...(scratchedDate && { scratchedDate }),
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, 'users', user.id, 'scratchOffPrizes'),
        newEntry
      );

      setEntries([{ ...newEntry, id: docRef.id }, ...entries]);
      
      // Reset form
      setCategory('');
      setDescription('');
      setCompletedDate(new Date().toISOString().split('T')[0]);
      setScratchedDate('');
      setIsAdding(false);

      toast({
        title: "Prize logged!",
        description: "Side challenge completed successfully",
      });
    } catch (error) {
      console.error('Error adding prize entry:', error);
      toast({
        title: "Error",
        description: "Failed to log prize entry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!user || !entryId) return;

    try {
      await deleteDoc(doc(db, 'users', user.id, 'scratchOffPrizes', entryId));
      setEntries(entries.filter(e => e.id !== entryId));
      
      toast({
        title: "Deleted",
        description: "Prize entry removed",
      });
    } catch (error) {
      console.error('Error deleting prize entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
    }
  };

  const getCategoryStats = () => {
    const stats: Record<string, number> = {};
    prizeCategories.forEach(cat => stats[cat] = 0);
    entries.forEach(entry => {
      if (stats[entry.category] !== undefined) {
        stats[entry.category]++;
      }
    });
    return stats;
  };

  const categoryStats = getCategoryStats();

  return (
    <Card className="relative flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent" />
            <CardTitle>Scratch-Off Prizes</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {entries.length} Earned
          </Badge>
        </div>
        <CardDescription>Track side challenges and rewards</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-y-auto flex flex-col">
        {/* Prize Categories Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {prizeCategories.map((cat) => (
            <div 
              key={cat}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-xs min-h-[2rem]"
            >
              <span className="flex-1 text-center sm:text-left">{cat}</span>
              <Badge variant="secondary" className="h-4 text-[10px] px-1.5 ml-2 shrink-0">
                {categoryStats[cat]}
              </Badge>
            </div>
          ))}
        </div>

        {/* Add New Entry Button */}
        {!isAdding && user?.role === 'admin' && (
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log New Prize
          </Button>
        )}

        {/* Add Entry Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 border rounded-lg p-3 bg-muted/20 flex-shrink-0"
            >
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs">Challenge Type</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="h-8 text-xs">
                    <SelectValue placeholder="Select challenge..." />
                  </SelectTrigger>
                  <SelectContent>
                    {prizeCategories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs">What You Did</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your achievement..."
                  className="h-16 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="completedDate" className="text-xs">Completed</Label>
                  <Input
                    id="completedDate"
                    type="date"
                    value={completedDate}
                    onChange={(e) => setCompletedDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scratchedDate" className="text-xs">Scratched (Optional)</Label>
                  <Input
                    id="scratchedDate"
                    type="date"
                    value={scratchedDate}
                    onChange={(e) => setScratchedDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleAdd}
                  disabled={loading}
                  size="sm"
                  className="flex-1"
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={() => {
                    setIsAdding(false);
                    setCategory('');
                    setDescription('');
                    setScratchedDate('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entries List */}
        <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No prizes logged yet</p>
              <p className="text-xs mt-1">Complete challenges to earn scratch-off rewards!</p>
            </div>
          ) : (
            entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px] h-4">
                        {entry.category}
                      </Badge>
                      {entry.scratchedDate && (
                        <Badge variant="outline" className="text-[10px] h-4 bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20">
                          Scratched ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium mb-1">{entry.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.completedDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric' 
                        })}
                      </span>
                      {entry.scratchedDate && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Gift className="h-3 w-3" />
                          {new Date(entry.scratchedDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  {user?.role === 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => entry.id && handleDelete(entry.id)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

