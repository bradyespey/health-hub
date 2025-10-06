import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
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
  Trash2,
  Database,
  RefreshCw
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
  const [rawHealthData, setRawHealthData] = useState<any[]>([]);
  const [loadingHealthData, setLoadingHealthData] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

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

  const loadRawHealthData = async () => {
    if (!user?.id) return;
    
    setLoadingHealthData(true);
    try {
      // Get recent Apple Health data from Firestore
      const today = new Date();
      const recentDates = [];
      
      // Get last 14 days of data for better coverage
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        recentDates.push(date.toISOString().split('T')[0]);
      }
      
      const allData: any[] = [];
      
      // Use 'brady' as the user ID (single-user app)
      const userId = 'brady';
      
      for (const dateStr of recentDates) {
        const dateCollectionRef = collection(db, 'appleHealth', userId, dateStr);
        const dateSnapshot = await getDocs(dateCollectionRef);
        
        dateSnapshot.forEach((doc) => {
          allData.push({
            id: doc.id,
            date: dateStr,
            ...doc.data()
          });
        });
      }
      
      // Sort by date descending, then by timestamp descending
      allData.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        
        if (a.timestamp && b.timestamp) {
          return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime();
        }
        return 0;
      });
      
      setRawHealthData(allData);
      
    } catch (error) {
      console.error('Error loading raw health data:', error);
      toast({
        title: "Error",
        description: "Failed to load raw health data",
        variant: "destructive",
      });
    } finally {
      setLoadingHealthData(false);
    }
  };

  // Filter raw health data
  const filteredData = rawHealthData.filter(record => {
    if (filterType && !record.type?.toLowerCase().includes(filterType.toLowerCase())) {
      return false;
    }
    if (filterSource && !record.source?.toLowerCase().includes(filterSource.toLowerCase())) {
      return false;
    }
    if (filterDate && record.date !== filterDate) {
      return false;
    }
    return true;
  });

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

      {/* Raw Apple Health Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Raw Apple Health Data
          </CardTitle>
          <CardDescription>
            View the latest Apple Health data imported from Health Auto Export to verify data freshness.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Button onClick={loadRawHealthData} disabled={loadingHealthData} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loadingHealthData ? 'animate-spin' : ''}`} />
              {loadingHealthData ? 'Loading...' : 'Load Data'}
            </Button>
            <Badge variant="outline">
              {filteredData.length} of {rawHealthData.length} records
            </Badge>
          </div>
          
          {rawHealthData.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Filter by Type</Label>
                  <Input
                    placeholder="e.g. dietary_energy"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Filter by Source</Label>
                  <Input
                    placeholder="e.g. health-auto-export"
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Filter by Date</Label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredData.map((record, index) => (
                  <div key={`${record.date}-${record.id}-${index}`} className="p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{record.type}</div>
                      <div className="text-xs text-muted-foreground">{record.date}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Value:</span> {new Intl.NumberFormat('en-US', { 
                          minimumFractionDigits: (record.value % 1 !== 0) ? 1 : 0, 
                          maximumFractionDigits: 1 
                        }).format(record.value)}
                        {record.unit && <span className="text-muted-foreground"> {record.unit}</span>}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Source:</span> {record.source || 'N/A'}
                      </div>
                      {record.min !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Min:</span> {record.min}
                        </div>
                      )}
                      {record.max !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Max:</span> {record.max}
                        </div>
                      )}
                    </div>
                    {record.timestamp && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Imported: {record.timestamp.toDate ? record.timestamp.toDate().toLocaleString() : 'Unknown'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          
          {rawHealthData.length === 0 && !loadingHealthData && (
            <div className="text-center p-4 text-muted-foreground">
              No Apple Health data found. Click "Refresh Data" to load recent imports.
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Data Backup & Restore */}
      <BackupManager />
    </div>
  );
}
