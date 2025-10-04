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
import { Mission185Card } from './Mission185Card';
import { ScratchOffPrizesCard } from './ScratchOffPrizesCard';
import { TextCard } from './TextCard';
import { Button } from '@/components/ui/button';
import { Square, SquareCheck, SquareCheckBig, Move, Plus, Trash2 } from 'lucide-react';
import { defaultPanelSizes, isCardDeletable, getCardConfig } from '@/utils/panelHelpers';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  size: CardSize;
  disabled?: boolean;
}

function SortableItem({ id, children, size, disabled }: SortableItemProps) {
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
        return 'col-span-1 h-48 w-64 max-w-xs overflow-hidden'; // Small square-ish card
      case 'medium':
        return 'col-span-1 h-64 max-w-2xl overflow-hidden';
      case 'large':
        return 'col-span-1 md:col-span-2 h-auto max-w-full';
      default:
        return 'col-span-1 h-64 max-w-2xl overflow-hidden';
    }
  };

  const handleSizeChange = (newSize: CardSize) => {
    updateCardSize(id, newSize);
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
        getSizeClasses(size),
        isDragging && 'opacity-50 z-50'
      )}
    >
      {/* Drag handle overlay */}
      {!disabled && (
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
          style={{ clipPath: 'polygon(0 0, calc(100% - 200px) 0, calc(100% - 200px) 100%, 0% 100%)' }}
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

// Default cards for Goals page
const defaultGoalsCards = [
  { id: 'mission-185', component: Mission185Card, order: 0, size: 'large' as CardSize },
  { id: 'scratch-off-prizes', component: ScratchOffPrizesCard, order: 1, size: 'large' as CardSize },
  { id: 'long-term-goal', component: LongTermGoalCard, order: 2, size: 'large' as CardSize },
  { id: 'challenge', component: ChallengeCard, order: 3, size: 'large' as CardSize },
];

const goalsCardComponents = {
  'mission-185': Mission185Card,
  'scratch-off-prizes': ScratchOffPrizesCard,
  'long-term-goal': LongTermGoalCard,
  'challenge': ChallengeCard,
};

export function GoalsGrid() {
  const { isEditMode, loading, layouts, updateCardSize, updateLayout } = useLayout();
  
  // Debug logging removed - Goals page working properly
  
  // Ensure goals cards exist in the layout system
  React.useEffect(() => {
    if (!loading && layouts.length > 0) {
      const goalsLayoutIds = ['mission-185', 'scratch-off-prizes', 'long-term-goal', 'challenge'];
      const existingGoalsIds = layouts.filter(l => goalsLayoutIds.includes(l.id)).map(l => l.id);
      const missingCards = defaultGoalsCards.filter(card => !existingGoalsIds.includes(card.id));
      
      // Add missing cards to the layout
      if (missingCards.length > 0) {
        const newLayouts = [...layouts, ...missingCards];
        updateLayout(newLayouts);
      }
    }
  }, [loading, layouts, updateLayout]);
  
  // Get goals-specific layouts from the main layout system
  const goalsCards = React.useMemo(() => {
    const goalsLayoutIds = ['mission-185', 'scratch-off-prizes', 'long-term-goal', 'challenge'];
    const goalsLayouts = layouts.filter(layout => 
      goalsLayoutIds.includes(layout.id) || layout.id.startsWith('text-card-')
    );
    
    // If no layouts found, use defaults
    if (goalsLayouts.length === 0) {
      return defaultGoalsCards;
    }
    
    return goalsLayouts
      .sort((a, b) => a.order - b.order)
      .map(layout => ({
        id: layout.id,
        component: goalsCardComponents[layout.id as keyof typeof goalsCardComponents],
        order: layout.order,
        size: layout.size
      }));
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
    
    if (over && active.id !== over.id) {
      // Get all goals cards sorted by order
      const goalsLayoutIds = ['mission-185', 'scratch-off-prizes', 'long-term-goal', 'challenge'];
      const goalsLayouts = layouts
        .filter(layout => 
          goalsLayoutIds.includes(layout.id) || layout.id.startsWith('text-card-')
        )
        .sort((a, b) => a.order - b.order);
      
      const oldIndex = goalsLayouts.findIndex((item) => item.id === active.id);
      const newIndex = goalsLayouts.findIndex((item) => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Remove active item and insert it at new position
        const reorderedCards = [...goalsLayouts];
        const [movedItem] = reorderedCards.splice(oldIndex, 1);
        reorderedCards.splice(newIndex, 0, movedItem);
        
        // Update orders sequentially
        const updatedLayouts = layouts.map(layout => {
          const cardIndex = reorderedCards.findIndex(card => card.id === layout.id);
          if (cardIndex !== -1) {
            return { ...layout, order: cardIndex };
          }
          return layout;
        });
        
        updateLayout(updatedLayouts);
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
              
              // Check if it's a text card
              if (card.id.startsWith('text-card-')) {
                return (
                  <SortableItem
                    key={card.id}
                    id={card.id}
                    size={card.size}
                    disabled={!isEditMode}
                  >
                    <TextCard 
                      id={card.id}
                      title="Goals Text Card"
                      description="Additional goals content"
                      size={card.size}
                    />
                  </SortableItem>
                );
              }
              
              // Handle standard goal components
              if (!CardComponent) {
                console.warn(`Card component not found for id: ${card.id}`);
                return null;
              }
              
              return (
                <SortableItem
                  key={card.id}
                  id={card.id}
                  size={card.size}
                  disabled={!isEditMode}
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
                <Trash2 className="h-4 w-4" />
                <span>Delete text cards</span>
              </div>
            </div>
          </div>
        )}
      </DndContext>
    </div>
  );
}
