import { createContext, useContext, useEffect, useState } from 'react';

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
  const [sidebarState, setSidebarStateInternal] = useState<SidebarState>(defaultState);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    try {
      const storedState = localStorage.getItem(storageKey) as SidebarState;
      if (storedState && ['expanded', 'collapsed', 'hover'].includes(storedState)) {
        setSidebarStateInternal(storedState);
      }
    } catch (error) {
      console.warn('Failed to load sidebar state from localStorage:', error);
    }
  }, [storageKey]);

  useEffect(() => {
    // Update expanded state based on sidebar state
    setIsExpanded(sidebarState === 'expanded');
  }, [sidebarState]);

  const setSidebarState = (state: SidebarState) => {
    setSidebarStateInternal(state);
    try {
      localStorage.setItem(storageKey, state);
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
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