import React from 'react';
import { CardSize } from '@/contexts/LayoutContext';
import { SinglePanelGrid } from '@/components/dashboard/SinglePanelGrid';

/**
 * Utility to create a new panel route that follows the same editing pattern
 * 
 * Usage example:
 * <Route path="/new-panel" element={createPanelRoute('newPanel')} />
 */
export function createPanelRoute(panelId: string) {
  return <SinglePanelGrid panelId={panelId} />;
}

/**
 * Default size constraints for different panel types.
 * Add new panel types here to define what sizes they support.
 */
export const defaultPanelSizes: Record<string, CardSize[]> = {
  readiness: ['medium', 'large'],
  nutrition: ['small', 'medium', 'large'],
  hydration: ['small', 'medium'],
  training: ['small', 'medium', 'large'],
  habits: ['medium', 'large'],
  milestones: ['small', 'medium', 'large'],
  'long-term-goal': ['small', 'medium', 'large'],
  'challenge': ['small', 'medium', 'large'],
  // Add new panels here:
  // newPanel: ['small', 'medium', 'large'],
};

/**
 * Helper to register a new panel type with its size constraints
 */
export function registerPanelType(panelId: string, allowedSizes: CardSize[]) {
  defaultPanelSizes[panelId] = allowedSizes;
}

/**
 * Navigation item interface for consistent navigation setup
 */
export interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Template for adding a new page:
 * 
 * 1. Create your panel component (e.g., NewPanelComponent)
 * 2. Add size constraints: registerPanelType('newPanel', ['small', 'medium', 'large'])
 * 3. Add route: <Route path="/new-panel" element={createPanelRoute('newPanel')} />
 * 4. Add to navigation items in sidebar/mobile nav
 * 5. Add default layout in LayoutContext defaultLayouts array
 */
