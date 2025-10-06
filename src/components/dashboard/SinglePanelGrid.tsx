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
}

function SortableItem({ id, children, colSpan = 1, size, disabled }: SortableItemProps) {
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
                Resize
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
};

interface SinglePanelGridProps {
  panelId: string;
}

export function SinglePanelGrid({ panelId }: SinglePanelGridProps) {
  const { layouts, isEditMode, updateLayout, loading } = useLayout();
  
  // Get all cards that should show on this page (main panel + any text cards)
  // MUST be before any conditional returns to follow Rules of Hooks
  const pageLayouts = React.useMemo(() => {
    // Find the main panel and any text cards
    const mainPanel = layouts.find(layout => layout.id === panelId);
    const textCards = layouts.filter(layout => layout.id.startsWith('text-card-'));
    
    // Combine main panel and text cards
    const allCards = [];
    if (mainPanel) {
      allCards.push(mainPanel);
    }
    allCards.push(...textCards);
    
    return allCards.sort((a, b) => a.order - b.order);
  }, [layouts, panelId]);
  
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
      const oldIndex = pageLayouts.findIndex((item) => item.id === active.id);
      const newIndex = pageLayouts.findIndex((item) => item.id === over.id);
      
      const newLayouts = arrayMove(pageLayouts, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index,
      }));
      
      // Update the full layouts array
      const updatedLayouts = layouts.map(layout => {
        const newLayout = newLayouts.find(nl => nl.id === layout.id);
        return newLayout || layout;
      });
      
      updateLayout(updatedLayouts);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 group">
          <div className="h-64 bg-muted/20 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  const PanelComponent = panelComponents[panelId as keyof typeof panelComponents];
  if (!PanelComponent && !pageLayouts.find(l => l.id === panelId)) {
    console.warn(`Panel component not found for id: ${panelId}`);
    return (
      <div className="p-6">
        <div className="text-center text-red-500">
          Panel component not found for id: {panelId}
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
          "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 group",
          isEditMode && "outline-2 outline-dashed outline-primary/20 p-4 rounded-lg"
        )}>
          <SortableContext 
            items={pageLayouts.map(item => item.id)} 
            strategy={rectSortingStrategy}
          >
            {pageLayouts.map((layout) => {
              // Check if it's a text card
              if (layout.id.startsWith('text-card-')) {
                return (
                  <SortableItem
                    key={layout.id}
                    id={layout.id}
                    colSpan={layout.colSpan}
                    size={layout.size}
                    disabled={!isEditMode}
                  >
                    <TextCard 
                      id={layout.id}
                      title={`${panelId.charAt(0).toUpperCase() + panelId.slice(1)} Text Card`}
                      description="Additional content for this section"
                      size={layout.size}
                    />
                  </SortableItem>
                );
              }
              
              // Handle the main panel component
              if (layout.id === panelId && PanelComponent) {
                return (
                  <SortableItem
                    key={layout.id}
                    id={layout.id}
                    colSpan={layout.colSpan}
                    size={layout.size}
                    disabled={!isEditMode}
                  >
                    <PanelComponent />
                  </SortableItem>
                );
              }
              
              return null;
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
