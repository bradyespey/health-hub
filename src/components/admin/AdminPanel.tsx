import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout, NavigationItem } from '@/contexts/LayoutContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { BackupManager } from './BackupManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  LayoutGrid, 
  Activity, 
  Apple, 
  Droplets, 
  Dumbbell, 
  CheckSquare, 
  Trophy,
  Settings,
  Star,
  GripVertical,
  Plus,
  Trash2
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Icon mapping for navigation items
const iconMap = {
  'LayoutGrid': LayoutGrid,
  'Activity': Activity,
  'Apple': Apple,
  'Droplets': Droplets,
  'Dumbbell': Dumbbell,
  'CheckSquare': CheckSquare,
  'Trophy': Trophy,
  'Settings': Settings,
};

const defaultNavigationItems: NavigationItem[] = [
  { title: 'Dashboard', url: '/', icon: 'LayoutGrid', order: 0 },
  { title: 'Readiness', url: '/readiness', icon: 'Activity', order: 1 },
  { title: 'Nutrition', url: '/nutrition', icon: 'Apple', order: 2 },
  { title: 'Hydration', url: '/hydration', icon: 'Droplets', order: 3 },
  { title: 'Training', url: '/training', icon: 'Dumbbell', order: 4 },
  { title: 'Habits', url: '/habits', icon: 'CheckSquare', order: 5 },
  { title: 'Goals', url: '/goals', icon: 'Trophy', order: 6 },
];

interface SortableNavigationItemProps {
  item: NavigationItem;
  onDelete: (id: string) => void;
}

function SortableNavigationItem({ item, onDelete }: SortableNavigationItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = iconMap[item.icon as keyof typeof iconMap] || Settings;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50"
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <IconComponent className="h-5 w-5 text-accent" />
      <div className="flex-1">
        <div className="font-medium">{item.title}</div>
        <div className="text-sm text-muted-foreground">{item.url}</div>
      </div>
      <div className="text-sm text-muted-foreground">Order: {item.order}</div>
      {!defaultNavigationItems.some(def => def.url === item.url) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(item.url)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function AdminPanel() {
  const { user } = useAuth();
  const { setDefaultLayout } = useLayout();
  const { refreshNavigation } = useNavigation();
  const { toast } = useToast();
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>(defaultNavigationItems);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user?.role === 'admin') {
      loadSystemSettings();
    }
  }, [user]);

  const loadSystemSettings = async () => {
    setLoading(true);
    try {
      const settingsDoc = await getDoc(doc(db, 'system', 'settings'));
      if (settingsDoc.exists() && settingsDoc.data().navigationItems) {
        const savedNavItems = settingsDoc.data().navigationItems as NavigationItem[];
        setNavigationItems(savedNavItems);
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveNavigationOrder = async () => {
    if (user?.role !== 'admin') return;
    
    setSaving(true);
    try {
      // Update order numbers based on array position
      const updatedItems = navigationItems.map((item, index) => ({
        ...item,
        order: index
      }));

      await setDoc(doc(db, 'system', 'settings'), {
        navigationItems: updatedItems,
        updatedAt: new Date(),
        updatedBy: user.id
      }, { merge: true });

      setNavigationItems(updatedItems);
      
      // Refresh navigation in other components
      await refreshNavigation();
      
      toast({
        title: "Success",
        description: "Navigation order saved",
      });
    } catch (error) {
      console.error('Error saving navigation order:', error);
      toast({
        title: "Error",
        description: "Failed to save navigation order",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setNavigationItems([...defaultNavigationItems]);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setNavigationItems((items) => {
        const oldIndex = items.findIndex((item) => item.url === active.id);
        const newIndex = items.findIndex((item) => item.url === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSetCurrentAsDefault = async () => {
    try {
      await setDefaultLayout();
      toast({
        title: "Success",
        description: "Current layout set as default for new users",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set default layout",
        variant: "destructive",
      });
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Access denied. Admin privileges required.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage system settings and configuration</p>
      </div>

      {/* Navigation Order Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Navigation Menu Order
          </CardTitle>
          <CardDescription>
            Drag and drop to reorder navigation menu items. Changes apply to all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center p-4 text-muted-foreground">Loading navigation settings...</div>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={navigationItems.map(item => item.url)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {navigationItems.map((item) => (
                      <SortableNavigationItem
                        key={item.url}
                        item={item}
                        onDelete={(url) => {
                          setNavigationItems(items => items.filter(i => i.url !== url));
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveNavigationOrder} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Order'}
                </Button>
                <Button variant="outline" onClick={resetToDefault}>
                  Reset to Default
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Layout Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Default Layout Management
          </CardTitle>
          <CardDescription>
            Manage the default layout that new users see when they first sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={handleSetCurrentAsDefault} className="gap-2">
              <Star className="h-4 w-4" />
              Set Current Layout as Default
            </Button>
            <Badge variant="outline">
              Current layout will be used for new users
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>
              • The current dashboard layout will become the default for new users
            </p>
            <p>
              • Existing users keep their personal layouts
            </p>
            <p>
              • You can also set defaults from saved presets in the Layout Presets dialog
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Apple Health Data Testing */}

      {/* Data Backup & Restore */}
      <BackupManager />
    </div>
  );
}
