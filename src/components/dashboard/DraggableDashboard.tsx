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
import { useLayout } from '@/contexts/LayoutContext';
import { ReadinessPanel } from './ReadinessPanel';
import { NutritionPanel } from './NutritionPanel';
import { HydrationPanel } from './HydrationPanel';
import { TrainingPanel } from './TrainingPanel';
import { HabitsPanel } from './HabitsPanel';
import { MilestonesPanel } from './MilestonesPanel';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  colSpan?: number;
  disabled?: boolean;
}

function SortableItem({ id, children, colSpan = 1, disabled }: SortableItemProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        colSpan === 2 && 'lg:col-span-2',
        isDragging && 'opacity-50 z-50',
        !disabled && 'cursor-grab active:cursor-grabbing'
      )}
      {...attributes}
      {...listeners}
    >
      {children}
      {!disabled && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-muted/80 rounded-md p-1 text-xs text-muted-foreground">
            Drag to reorder
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
  milestones: MilestonesPanel,
};

export function DraggableDashboard() {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
        "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 group",
        isEditMode && "outline-2 outline-dashed outline-primary/20 p-4 rounded-lg"
      )}>
        <SortableContext 
          items={sortedLayouts.map(item => item.id)} 
          strategy={rectSortingStrategy}
        >
          {sortedLayouts.map((layout) => {
            const PanelComponent = panelComponents[layout.id as keyof typeof panelComponents];
            
            if (!PanelComponent) {
              console.warn(`Panel component not found for id: ${layout.id}`);
              return null;
            }

            return (
              <SortableItem
                key={layout.id}
                id={layout.id}
                colSpan={layout.colSpan}
                disabled={!isEditMode}
              >
                <PanelComponent />
              </SortableItem>
            );
          })}
        </SortableContext>
      </div>
      
      {isEditMode && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Drag and drop panels to rearrange your dashboard
        </div>
      )}
    </DndContext>
  );
}