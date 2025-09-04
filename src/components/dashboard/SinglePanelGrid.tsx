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
import { Button } from '@/components/ui/button';
import { Square, SquareCheck, SquareCheckBig, Move } from 'lucide-react';
import { defaultPanelSizes } from '@/utils/panelHelpers';

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

  const { updateCardSize } = useLayout();

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

  const allowedSizes = defaultPanelSizes[id] || ['small', 'medium', 'large'];

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

  // No drag handling for single panels
  const handleDragEnd = (event: DragEndEvent) => {};

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 group">
          <div className="h-64 bg-muted/20 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  // Find the layout for this specific panel
  const layout = layouts.find(l => l.id === panelId);
  if (!layout) {
    console.warn(`Layout not found for panel: ${panelId}`);
    return null;
  }

  const PanelComponent = panelComponents[panelId as keyof typeof panelComponents];
  if (!PanelComponent) {
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
            items={[layout.id]} 
            strategy={rectSortingStrategy}
          >
            <SortableItem
              key={layout.id}
              id={layout.id}
              colSpan={layout.colSpan}
              size={layout.size}
              disabled={!isEditMode}
            >
              <PanelComponent />
            </SortableItem>
          </SortableContext>
        </div>
        
        {isEditMode && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                <span>Hover to resize</span>
              </div>
            </div>
          </div>
        )}
      </DndContext>
    </div>
  );
}
