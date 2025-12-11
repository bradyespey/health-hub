import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { useLayout, CardSize } from '@/contexts/LayoutContext';
import { ReadinessPanel } from './ReadinessPanel';
import { NutritionPanel } from './NutritionPanel';
import { HydrationPanel } from './HydrationPanel';
import { TrainingPanel } from './TrainingPanel';
import { HabitsPanel } from './HabitsPanel';
import { GoalsPanel } from './GoalsPanel';
import { TextCard } from './TextCard';
import { Button } from '@/components/ui/button';
import { Square, SquareCheck, SquareCheckBig, Move, Plus, Trash2 } from 'lucide-react';
import { defaultPanelSizes, isCardDeletable, getCardConfig } from '@/utils/panelHelpers';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  colSpan?: number;
  size: CardSize;
  disabled?: boolean;
  onSizeChange?: (cardId: string, size: CardSize) => void;
  isEditMode?: boolean;
}

// Use centralized size constraints

function SortableItem({ id, children, colSpan = 1, size, disabled, onSizeChange, isEditMode }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const { updateCardSize, deleteCard } = useLayout();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getSizeClasses = (size: CardSize) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-1 md:col-span-2';
      case 'large':
        return 'col-span-1 md:col-span-2 xl:col-span-4';
      default:
        return 'col-span-1';
    }
  };

  const handleSizeChange = (newSize: CardSize) => {
    if (onSizeChange) {
      onSizeChange(id, newSize);
    } else {
      updateCardSize(id, newSize);
    }
  };

  const handleDelete = () => {
    if (isCardDeletable(id) && window.confirm('Are you sure you want to delete this card?')) {
      deleteCard(id);
    }
  };

  const cardConfig = getCardConfig(id);
  const allowedSizes = cardConfig.allowedSizes;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        colSpan === 2 && 'lg:col-span-2',
        getSizeClasses(size),
        isDragging && 'opacity-50 z-50'
      )}
      {...attributes}
    >
      {/* Drag handle overlay */}
      {!disabled && (
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
          {...listeners}
        />
      )}
      
      {children}
      
      {!disabled && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <div className="bg-background/95 backdrop-blur-sm border rounded-xl p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {allowedSizes.includes('small') && (
                  <Button
                    variant={size === 'small' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg relative z-30"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleSizeChange('small');
                    }}
                    title="Small"
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                )}
                {allowedSizes.includes('medium') && (
                  <Button
                    variant={size === 'medium' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg relative z-30"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleSizeChange('medium');
                    }}
                    title="Medium"
                  >
                    <SquareCheck className="h-3 w-3" />
                  </Button>
                )}
                {allowedSizes.includes('large') && (
                  <Button
                    variant={size === 'large' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg relative z-30"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleSizeChange('large');
                    }}
                    title="Large"
                  >
                    <SquareCheckBig className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {cardConfig.deletable && (
                <>
                  <div className="w-px h-4 bg-border mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg relative z-30 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDelete();
                    }}
                    title="Delete Card"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
              <div className="w-px h-4 bg-border mx-1" />
              <div 
                className="text-xs text-muted-foreground flex items-center gap-1 cursor-grab active:cursor-grabbing"
                {...listeners}
              >
                <Move className="h-3 w-3" />
                Drag
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const panelComponents = {
  readiness: ReadinessPanel,
  nutrition: NutritionPanel,
  hydration: HydrationPanel,
  training: TrainingPanel,
  habits: HabitsPanel,
  milestones: GoalsPanel,
  // Goal-related panels should only be used in GoalsGrid, not DashboardGrid
  'long-term-goal': null,
  'challenge': null,
  'mission-185': null,
  'scratch-off-prizes': null,
};

export function DashboardGrid() {
  const { layouts, isEditMode, updateLayout, loading } = useLayout();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = layouts.findIndex((item) => item.id === active.id);
      const newIndex = layouts.findIndex((item) => item.id === over.id);
      
      const newLayouts = arrayMove(layouts, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index,
      }));
      
      updateLayout(newLayouts);
    }
  };


  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-muted/20 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const sortedLayouts = [...layouts].sort((a, b) => a.order - b.order);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 group",
        isEditMode && "outline-2 outline-dashed outline-primary/20 p-4 rounded-lg"
      )}>
        <SortableContext 
          items={sortedLayouts.map(item => item.id)} 
          strategy={rectSortingStrategy}
        >
          {sortedLayouts.map((layout) => {
            const PanelComponent = panelComponents[layout.id as keyof typeof panelComponents];
            
            // Check if it's a text card
            if (layout.id.startsWith('text-card-')) {
              return (
                <SortableItem
                  key={layout.id}
                  id={layout.id}
                  colSpan={layout.colSpan}
                  size={layout.size}
                  disabled={!isEditMode}
                  isEditMode={isEditMode}
                >
                  <TextCard 
                    id={layout.id}
                    title="Custom Text Card"
                    description="Your custom content"
                    size={layout.size}
                  />
                </SortableItem>
              );
            }
            
            // Handle standard panel components
            if (!PanelComponent) {
              // Skip goal-related panels that belong in GoalsGrid
              if (['long-term-goal', 'challenge', 'mission-185', 'scratch-off-prizes', 'goals'].includes(layout.id)) {
                return null;
              }
              // Only warn for unexpected panel IDs, not known ones like 'goals'
              if (!['goals'].includes(layout.id)) {
              console.warn(`Panel component not found for id: ${layout.id}`);
              }
              return null;
            }

            return (
              <SortableItem
                key={layout.id}
                id={layout.id}
                colSpan={layout.colSpan}
                size={layout.size}
                disabled={!isEditMode}
                isEditMode={isEditMode}
              >
                <PanelComponent />
              </SortableItem>
            );
          })}
        </SortableContext>
      </div>
      
      {isEditMode && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              <span>Drag to reorder</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              <span>Hover to resize</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              <span>Delete text cards</span>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}