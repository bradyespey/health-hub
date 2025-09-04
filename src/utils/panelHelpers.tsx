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
 * Card type definitions for distinguishing between API data cards and user-editable text cards
 */
export type CardType = 'api' | 'text';

export interface CardConfig {
  type: CardType;
  allowedSizes: CardSize[];
  deletable: boolean;
}

/**
 * Default size constraints and configuration for different panel types.
 * Add new panel types here to define what sizes they support.
 */
export const defaultPanelConfigs: Record<string, CardConfig> = {
  // API Cards - Show data from external sources, not deletable
  readiness: { type: 'api', allowedSizes: ['medium', 'large'], deletable: false },
  nutrition: { type: 'api', allowedSizes: ['small', 'medium', 'large'], deletable: false },
  hydration: { type: 'api', allowedSizes: ['small', 'medium'], deletable: false },
  training: { type: 'api', allowedSizes: ['small', 'medium', 'large'], deletable: false },
  habits: { type: 'api', allowedSizes: ['medium', 'large'], deletable: false },
  milestones: { type: 'api', allowedSizes: ['small', 'medium', 'large'], deletable: false },
  goals: { type: 'api', allowedSizes: ['small', 'medium', 'large'], deletable: false },
  
  // Text Cards - User-editable content, deletable
  'long-term-goal': { type: 'text', allowedSizes: ['small', 'medium', 'large'], deletable: true },
  'challenge': { type: 'text', allowedSizes: ['small', 'medium', 'large'], deletable: true },
};

/**
 * Backward compatibility - get allowed sizes for a panel
 */
export const defaultPanelSizes: Record<string, CardSize[]> = Object.fromEntries(
  Object.entries(defaultPanelConfigs).map(([key, config]) => [key, config.allowedSizes])
);

/**
 * Helper to register a new panel type with its size constraints
 */
export function registerPanelType(panelId: string, allowedSizes: CardSize[]) {
  defaultPanelSizes[panelId] = allowedSizes;
}

/**
 * Helper to register a new text card type that can be added/deleted
 */
export function registerTextCardType(panelId: string, allowedSizes: CardSize[] = ['small', 'medium', 'large']) {
  defaultPanelConfigs[panelId] = {
    type: 'text',
    allowedSizes,
    deletable: true
  };
  defaultPanelSizes[panelId] = allowedSizes;
}

/**
 * Check if a card is deletable
 */
export function isCardDeletable(cardId: string): boolean {
  // Dynamic text cards are always deletable if they match the pattern
  if (cardId.startsWith('text-card-')) {
    return true;
  }
  
  // Check configuration for other cards
  const config = defaultPanelConfigs[cardId];
  return config?.deletable ?? false;
}

/**
 * Check if a card is a text card (editable content)
 */
export function isTextCard(cardId: string): boolean {
  // Dynamic text cards are always text cards
  if (cardId.startsWith('text-card-')) {
    return true;
  }
  
  // Check configuration for other cards
  const config = defaultPanelConfigs[cardId];
  return config?.type === 'text' ?? false;
}

/**
 * Get card configuration
 */
export function getCardConfig(cardId: string): CardConfig {
  // Dynamic text cards get default text card config
  if (cardId.startsWith('text-card-')) {
    return {
      type: 'text',
      allowedSizes: ['small', 'medium', 'large'],
      deletable: true
    };
  }
  
  // Return existing config or default API card config
  return defaultPanelConfigs[cardId] ?? {
    type: 'api',
    allowedSizes: ['medium', 'large'],
    deletable: false
  };
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
