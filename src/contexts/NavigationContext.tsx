import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { NavigationItem } from './LayoutContext';
import { useAuth } from './AuthContext';
import { 
  LayoutGrid, 
  Activity, 
  Apple, 
  Droplets, 
  Dumbbell, 
  CheckSquare, 
  Trophy,
  Settings
} from 'lucide-react';

// Icon mapping for converting string names to components
export const iconMap = {
  'LayoutGrid': LayoutGrid,
  'Activity': Activity,
  'Apple': Apple,
  'Droplets': Droplets,
  'Dumbbell': Dumbbell,
  'CheckSquare': CheckSquare,
  'Trophy': Trophy,
  'Settings': Settings,
};

const defaultNavigationItems: NavigationItem[] = [
  { title: 'Dashboard', url: '/', icon: 'LayoutGrid', order: 0 },
  { title: 'Readiness', url: '/readiness', icon: 'Activity', order: 1 },
  { title: 'Nutrition', url: '/nutrition', icon: 'Apple', order: 2 },
  { title: 'Hydration', url: '/hydration', icon: 'Droplets', order: 3 },
  { title: 'Training', url: '/training', icon: 'Dumbbell', order: 4 },
  { title: 'Habits', url: '/habits', icon: 'CheckSquare', order: 5 },
  { title: 'Goals', url: '/goals', icon: 'Trophy', order: 6 },
];

interface NavigationContextType {
  navigationItems: NavigationItem[];
  loading: boolean;
  refreshNavigation: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isDemo = !user;
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>(defaultNavigationItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNavigationItems();
  }, [isDemo]);

  const loadNavigationItems = async () => {
    setLoading(true);
    
    // In demo mode, use default navigation items without Firestore access
    if (isDemo) {
      setNavigationItems(defaultNavigationItems);
      setLoading(false);
      return;
    }
    
    try {
      const settingsDoc = await getDoc(doc(db, 'system', 'settings'));
      if (settingsDoc.exists() && settingsDoc.data().navigationItems) {
        const savedNavItems = settingsDoc.data().navigationItems as NavigationItem[];
        // Sort by order to ensure correct display order
        const sortedItems = savedNavItems.sort((a, b) => a.order - b.order);
        setNavigationItems(sortedItems);
      } else {
        // Use default items if no saved configuration
        setNavigationItems(defaultNavigationItems);
      }
    } catch (error) {
      // Suppress permission errors in demo/public mode
      if (error instanceof Error && (error.message.includes('permission') || error.message.includes('Missing or insufficient'))) {
        console.warn('Firestore permission error (expected in demo mode):', error);
      } else {
        console.error('Error loading navigation items:', error);
      }
      // Fall back to default items on error
      setNavigationItems(defaultNavigationItems);
    } finally {
      setLoading(false);
    }
  };

  const refreshNavigation = async () => {
    if (!isDemo) {
      await loadNavigationItems();
    }
  };

  return (
    <NavigationContext.Provider value={{
      navigationItems,
      loading,
      refreshNavigation
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
