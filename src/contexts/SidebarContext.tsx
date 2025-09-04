import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthSafe } from './AuthContext';

type SidebarState = 'expanded' | 'collapsed' | 'hover';

interface SidebarContextType {
  sidebarState: SidebarState;
  setSidebarState: (state: SidebarState) => void;
  isExpanded: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultState?: SidebarState;
  storageKey?: string;
}

export function SidebarProvider({
  children,
  defaultState = 'expanded',
  storageKey = 'sidebar-state',
}: SidebarProviderProps) {
  const { user, updateUserPreferences } = useAuthSafe();
  const [sidebarState, setSidebarStateInternal] = useState<SidebarState>(defaultState);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load from user preferences first, then localStorage fallback
    if (user?.preferences?.sidebarState) {
      setSidebarStateInternal(user.preferences.sidebarState);
    } else {
      try {
        const storedState = localStorage.getItem(storageKey) as SidebarState;
        if (storedState && ['expanded', 'collapsed', 'hover'].includes(storedState)) {
          setSidebarStateInternal(storedState);
        }
      } catch (error) {
        console.warn('Failed to load sidebar state from localStorage:', error);
      }
    }
  }, [user?.preferences?.sidebarState, storageKey]);

  useEffect(() => {
    // Update expanded state based on sidebar state
    setIsExpanded(sidebarState === 'expanded');
  }, [sidebarState]);

  const setSidebarState = async (state: SidebarState) => {
    setSidebarStateInternal(state);
    
    // Save to user preferences if user is logged in and updateUserPreferences is available
    if (user && updateUserPreferences) {
      try {
        await updateUserPreferences({ sidebarState: state });
      } catch (error) {
        console.warn('Failed to save sidebar state to user preferences:', error);
        // Fallback to localStorage
        try {
          localStorage.setItem(storageKey, state);
        } catch (localError) {
          console.warn('Failed to save sidebar state to localStorage:', localError);
        }
      }
    } else {
      // Fallback to localStorage for non-authenticated users or when auth context isn't available
      try {
        localStorage.setItem(storageKey, state);
      } catch (error) {
        console.warn('Failed to save sidebar state to localStorage:', error);
      }
    }
  };

  return (
    <SidebarContext.Provider 
      value={{ 
        sidebarState, 
        setSidebarState, 
        isExpanded 
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarState() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarState must be used within a SidebarProvider');
  }
  return context;
}