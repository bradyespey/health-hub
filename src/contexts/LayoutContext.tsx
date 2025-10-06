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

export interface LayoutPreset {
  id: string;
  name: string;
  layouts: CardLayout[];
  createdAt: Date;
  isDefault?: boolean;
}

export interface NavigationItem {
  title: string;
  url: string;
  icon: string; // Store as string instead of component for Firestore
  order: number;
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
  // Layout preset functions
  saveLayoutPreset: (name: string) => Promise<void>;
  loadLayoutPreset: (presetId: string) => Promise<void>;
  getLayoutPresets: () => Promise<LayoutPreset[]>;
  deleteLayoutPreset: (presetId: string) => Promise<void>;
  setDefaultLayout: (presetId?: string) => Promise<void>;
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
        // Load system default or use hardcoded default
        const systemDefaultLayouts = await loadSystemDefaultLayout();
        const layoutsToUse = systemDefaultLayouts || defaultLayouts;
        setLayouts(layoutsToUse);
        setOriginalLayouts(layoutsToUse);
        await saveLayoutToFirestore(layoutsToUse);
      }
    } catch (error) {
      console.error('Error loading layout:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemDefaultLayout = async (): Promise<CardLayout[] | null> => {
    try {
      const systemDoc = await getDoc(doc(db, 'system', 'settings'));
      if (systemDoc.exists() && systemDoc.data().defaultLayout) {
        return systemDoc.data().defaultLayout as CardLayout[];
      }
      return null;
    } catch (error) {
      console.error('Error loading system default layout:', error);
      return null;
    }
  };

  const saveLayoutToFirestore = async (newLayouts: CardLayout[]) => {
    if (!user?.id) return;

    try {
      // Clean the layouts data to remove any functions or invalid Firestore data
      const cleanLayouts = newLayouts.map(layout => ({
        id: layout.id,
        size: layout.size,
        order: layout.order,
        ...(layout.colSpan && { colSpan: layout.colSpan })
      }));

      await setDoc(doc(db, 'layouts', user.id, 'pages', 'dashboard'), {
        layouts: cleanLayouts,
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

  const saveLayoutPreset = async (name: string) => {
    if (!user?.id) return;

    const presetId = `preset-${Date.now()}`;
    const preset: LayoutPreset = {
      id: presetId,
      name,
      layouts: [...layouts],
      createdAt: new Date()
    };

    try {
      await setDoc(doc(db, 'layouts', user.id, 'presets', presetId), preset);
    } catch (error) {
      console.error('Error saving layout preset:', error);
      throw error;
    }
  };

  const loadLayoutPreset = async (presetId: string) => {
    if (!user?.id) return;

    try {
      const presetDoc = await getDoc(doc(db, 'layouts', user.id, 'presets', presetId));
      if (presetDoc.exists()) {
        const preset = presetDoc.data() as LayoutPreset;
        setLayouts(preset.layouts);
        setOriginalLayouts(preset.layouts);
        await saveLayoutToFirestore(preset.layouts);
      }
    } catch (error) {
      console.error('Error loading layout preset:', error);
      throw error;
    }
  };

  const getLayoutPresets = async (): Promise<LayoutPreset[]> => {
    if (!user?.id) return [];

    try {
      const { getDocs, collection } = await import('firebase/firestore');
      const presetsSnapshot = await getDocs(collection(db, 'layouts', user.id, 'presets'));
      return presetsSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as LayoutPreset[];
    } catch (error) {
      console.error('Error getting layout presets:', error);
      return [];
    }
  };

  const deleteLayoutPreset = async (presetId: string) => {
    if (!user?.id) return;

    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'layouts', user.id, 'presets', presetId));
    } catch (error) {
      console.error('Error deleting layout preset:', error);
      throw error;
    }
  };

  const setDefaultLayout = async (presetId?: string) => {
    if (!user?.id || user.role !== 'admin') return;

    try {
      if (presetId) {
        // Set a specific preset as default
        const presetDoc = await getDoc(doc(db, 'layouts', user.id, 'presets', presetId));
        if (presetDoc.exists()) {
          const preset = presetDoc.data() as LayoutPreset;
          await setDoc(doc(db, 'system', 'settings'), {
            defaultLayout: preset.layouts,
            updatedAt: new Date(),
            updatedBy: user.id
          }, { merge: true });
        }
      } else {
        // Set current layout as default
        await setDoc(doc(db, 'system', 'settings'), {
          defaultLayout: layouts,
          updatedAt: new Date(),
          updatedBy: user.id
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error setting default layout:', error);
      throw error;
    }
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
      loading,
      saveLayoutPreset,
      loadLayoutPreset,
      getLayoutPresets,
      deleteLayoutPreset,
      setDefaultLayout
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