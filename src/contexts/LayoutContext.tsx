import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from './AuthContext';
import { useLocation } from 'react-router-dom';

export type CardSize = 'small' | 'medium' | 'large';

export interface CardLayout {
  id: string;
  order: number;
  colSpan?: number;
  size: CardSize;
}

interface LayoutContextType {
  layouts: CardLayout[];
  isEditMode: boolean;
  setEditMode: (enabled: boolean) => void;
  updateLayout: (layouts: CardLayout[]) => void;
  updateCardSize: (cardId: string, size: CardSize) => void;
  addCard: (cardType: 'text', title?: string, description?: string) => string;
  deleteCard: (cardId: string) => void;
  deleteAllTextCards: () => void;
  cancelEdit: () => void;
  loading: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const defaultLayouts: CardLayout[] = [
  { id: 'readiness', order: 0, colSpan: 2, size: 'large' },
  { id: 'hydration', order: 1, size: 'small' },
  { id: 'nutrition', order: 2, size: 'medium' },
  { id: 'training', order: 3, size: 'medium' },
  { id: 'habits', order: 4, colSpan: 2, size: 'large' },
  { id: 'goals', order: 5, size: 'medium' },
  { id: 'long-term-goal', order: 6, size: 'large' },
  { id: 'challenge', order: 7, size: 'large' }
];

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layouts, setLayouts] = useState<CardLayout[]>(defaultLayouts);
  const [originalLayouts, setOriginalLayouts] = useState<CardLayout[]>(defaultLayouts);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user?.id) {
      loadLayoutFromFirestore();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  // Cancel edit mode when navigating to a different page
  useEffect(() => {
    if (isEditMode) {
      cancelEdit();
    }
  }, [location.pathname]);

  const loadLayoutFromFirestore = async () => {
    if (!user?.id) return;

    try {
      const layoutDoc = await getDoc(doc(db, 'layouts', user.id, 'pages', 'dashboard'));
      
      if (layoutDoc.exists()) {
        const savedLayouts = layoutDoc.data().layouts as CardLayout[];
        // Migrate existing layouts to include size property if missing
        const migratedLayouts = savedLayouts.map(layout => ({
          ...layout,
          size: layout.size || 'medium' // Default to medium if size is missing
        }));
        setLayouts(migratedLayouts);
        setOriginalLayouts(migratedLayouts);
        
        // Save migrated layouts if any were updated
        if (savedLayouts.some(layout => !layout.size)) {
          await saveLayoutToFirestore(migratedLayouts);
        }
      } else {
        // Use defaults and save them
        setOriginalLayouts(defaultLayouts);
        await saveLayoutToFirestore(defaultLayouts);
      }
    } catch (error) {
      console.error('Error loading layout:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLayoutToFirestore = async (newLayouts: CardLayout[]) => {
    if (!user?.id) return;

    try {
      await setDoc(doc(db, 'layouts', user.id, 'pages', 'dashboard'), {
        layouts: newLayouts,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  const updateLayout = async (newLayouts: CardLayout[]) => {
    setLayouts(newLayouts);
    await saveLayoutToFirestore(newLayouts);
  };

  const updateCardSize = async (cardId: string, size: CardSize) => {
    const newLayouts = layouts.map(layout => 
      layout.id === cardId ? { ...layout, size } : layout
    );
    setLayouts(newLayouts);
    await saveLayoutToFirestore(newLayouts);
  };

  const setEditMode = (enabled: boolean) => {
    if (enabled) {
      // Store original state when entering edit mode
      setOriginalLayouts([...layouts]);
    } else {
      // Save changes when exiting edit mode
      saveLayoutToFirestore(layouts);
    }
    setIsEditMode(enabled);
  };

  const addCard = (cardType: 'text', title?: string, description?: string): string => {
    const newCardId = `${cardType}-card-${Date.now()}`;
    const maxOrder = Math.max(...layouts.map(l => l.order), -1);
    
    const newCard: CardLayout = {
      id: newCardId,
      order: maxOrder + 1,
      size: 'medium'
    };

    const newLayouts = [...layouts, newCard];
    setLayouts(newLayouts);
    
    // Save immediately if not in edit mode
    if (!isEditMode) {
      saveLayoutToFirestore(newLayouts);
    }

    return newCardId;
  };

  const deleteCard = (cardId: string) => {
    const newLayouts = layouts.filter(layout => layout.id !== cardId);
    // Reorder the remaining cards
    const reorderedLayouts = newLayouts.map((layout, index) => ({
      ...layout,
      order: index
    }));
    
    setLayouts(reorderedLayouts);
    
    // Save immediately if not in edit mode
    if (!isEditMode) {
      saveLayoutToFirestore(reorderedLayouts);
    }
  };

  const deleteAllTextCards = () => {
    const newLayouts = layouts.filter(layout => !layout.id.startsWith('text-card-'));
    // Reorder the remaining cards
    const reorderedLayouts = newLayouts.map((layout, index) => ({
      ...layout,
      order: index
    }));
    
    setLayouts(reorderedLayouts);
    saveLayoutToFirestore(reorderedLayouts);
  };

  const cancelEdit = () => {
    // Restore original layouts and exit edit mode
    setLayouts([...originalLayouts]);
    setIsEditMode(false);
  };

  return (
    <LayoutContext.Provider value={{
      layouts,
      isEditMode,
      setEditMode,
      updateLayout,
      updateCardSize,
      addCard,
      deleteCard,
      deleteAllTextCards,
      cancelEdit,
      loading
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}