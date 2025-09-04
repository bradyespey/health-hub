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
import { LongTermGoalCard } from './LongTermGoalCard';
import { ChallengeCard } from './ChallengeCard';
import { Button } from '@/components/ui/button';
import { Square, SquareCheck, SquareCheckBig, Move, Plus } from 'lucide-react';
import { defaultPanelSizes } from '@/utils/panelHelpers';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  size: CardSize;
  disabled?: boolean;
  onDelete?: () => void;
  isDeletable?: boolean;
  onSizeChange?: (id: string, size: CardSize) => void;
  isEditMode?: boolean;
}

function SortableItem({ id, children, size, disabled, onDelete, isDeletable, onSizeChange, isEditMode }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getSizeClasses = (size: CardSize) => {
    switch (size) {
      case 'small':
        return 'col-span-1 h-48 max-w-sm overflow-hidden'; // Make small cards shorter and narrower with overflow hidden
      case 'medium':
        return 'col-span-1 h-64 max-w-2xl overflow-hidden';
      case 'large':
        return 'col-span-1 md:col-span-2 h-auto max-w-full';
      default:
        return 'col-span-1 h-64 max-w-2xl overflow-hidden';
    }
  };

  const handleSizeChange = (newSize: CardSize) => {
    if (onSizeChange) {
      onSizeChange(id, newSize);
    }
  };

  const allowedSizes = defaultPanelSizes[id] || ['small', 'medium', 'large'];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        getSizeClasses(size),
        isDragging && 'opacity-50 z-50'
      )}
    >
      {/* Drag handle overlay - only when in edit mode */}
      {!disabled && isEditMode && (
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
          {...attributes}
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

// Default cards for Goals page
const defaultGoalsCards = [
  { id: 'long-term-goal', component: LongTermGoalCard, order: 0, size: 'large' as CardSize },
  { id: 'challenge', component: ChallengeCard, order: 1, size: 'large' as CardSize },
];

const goalsCardComponents = {
  'long-term-goal': LongTermGoalCard,
  'challenge': ChallengeCard,
};

export function GoalsGrid() {
  const { isEditMode, loading, layouts, updateCardSize, updateLayout } = useLayout();
  
  // Get goals-specific layouts or use defaults
  const goalsCards = React.useMemo(() => {
    const goalsLayouts = layouts.filter(layout => 
      layout.id === 'long-term-goal' || layout.id === 'challenge'
    );
    
    if (goalsLayouts.length === 0) {
      return defaultGoalsCards;
    }
    
    return goalsLayouts.map(layout => ({
      id: layout.id,
      component: goalsCardComponents[layout.id as keyof typeof goalsCardComponents],
      order: layout.order,
      size: layout.size
    })).sort((a, b) => a.order - b.order);
  }, [layouts]);
  
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
    
    if (active.id !== over?.id && over?.id) {
      console.log('Drag end:', active.id, 'to', over.id);
      // For now, just trigger a simple update to test
      // We'll swap the order of the two cards
      const activeCard = layouts.find(l => l.id === active.id);
      const overCard = layouts.find(l => l.id === over.id);
      
      if (activeCard && overCard) {
        // Swap their orders
        const newLayouts = layouts.map(layout => {
          if (layout.id === active.id) {
            return { ...layout, order: overCard.order };
          }
          if (layout.id === over.id) {
            return { ...layout, order: activeCard.order };
          }
          return layout;
        });
        
        updateLayout(newLayouts);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 group">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted/20 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className={cn(
          "grid gap-4 md:gap-6 group",
          "grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] xl:grid-cols-[repeat(auto-fit,minmax(350px,1fr))]",
          isEditMode && "outline-2 outline-dashed outline-primary/20 p-4 rounded-lg"
        )}>
          <SortableContext 
            items={goalsCards.map(card => card.id)} 
            strategy={rectSortingStrategy}
          >
            {goalsCards.map((card) => {
              const CardComponent = goalsCardComponents[card.id as keyof typeof goalsCardComponents];
              
              return (
                <SortableItem
                  key={card.id}
                  id={card.id}
                  size={card.size}
                  disabled={!isEditMode}
                  onSizeChange={updateCardSize}
                  isEditMode={isEditMode}
                >
                  <CardComponent />
                </SortableItem>
              );
            })}
          </SortableContext>
        </div>
        
        {isEditMode && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                <span>Hover to resize</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Add cards (coming soon)</span>
              </div>
            </div>
          </div>
        )}
      </DndContext>
    </div>
  );
}
