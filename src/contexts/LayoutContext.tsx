import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from './AuthContext';

export interface CardLayout {
  id: string;
  order: number;
  colSpan?: number;
}

interface LayoutContextType {
  layouts: CardLayout[];
  isEditMode: boolean;
  setEditMode: (enabled: boolean) => void;
  updateLayout: (layouts: CardLayout[]) => void;
  loading: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const defaultLayouts: CardLayout[] = [
  { id: 'readiness', order: 0, colSpan: 2 },
  { id: 'hydration', order: 1 },
  { id: 'nutrition', order: 2 },
  { id: 'training', order: 3 },
  { id: 'habits', order: 4, colSpan: 2 },
  { id: 'milestones', order: 5 }
];

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layouts, setLayouts] = useState<CardLayout[]>(defaultLayouts);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadLayoutFromFirestore();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadLayoutFromFirestore = async () => {
    if (!user?.id) return;

    try {
      const layoutDoc = await getDoc(doc(db, 'layouts', user.id, 'pages', 'dashboard'));
      
      if (layoutDoc.exists()) {
        const savedLayouts = layoutDoc.data().layouts as CardLayout[];
        setLayouts(savedLayouts);
      } else {
        // Use defaults and save them
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

  const setEditMode = (enabled: boolean) => {
    setIsEditMode(enabled);
  };

  return (
    <LayoutContext.Provider value={{
      layouts,
      isEditMode,
      setEditMode,
      updateLayout,
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