import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLayout, LayoutPreset } from '@/contexts/LayoutContext';
import { useAuth } from '@/contexts/AuthContext';
import { Save, FolderOpen, Trash2, Download, Upload, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LayoutPresetDialogProps {
  children: React.ReactNode;
}

export function LayoutPresetDialog({ children }: LayoutPresetDialogProps) {
  const [open, setOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<LayoutPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const { saveLayoutPreset, loadLayoutPreset, getLayoutPresets, deleteLayoutPreset, setDefaultLayout } = useLayout();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadPresets();
    }
  }, [open]);

  const loadPresets = async () => {
    setLoading(true);
    try {
      const userPresets = await getLayoutPresets();
      setPresets(userPresets);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load layout presets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a preset name",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveLayoutPreset(presetName.trim());
      toast({
        title: "Success",
        description: `Layout preset "${presetName}" saved`,
      });
      setPresetName('');
      loadPresets();
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to save layout preset",
        variant: "destructive",
      });
    }
  };

  const handleLoadPreset = async (presetId: string, presetName: string) => {
    try {
      await loadLayoutPreset(presetId);
      toast({
        title: "Success",
        description: `Layout "${presetName}" loaded`,
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load layout preset",
        variant: "destructive",
      });
    }
  };

  const handleDeletePreset = async (presetId: string, presetName: string) => {
    try {
      await deleteLayoutPreset(presetId);
      toast({
        title: "Success",
        description: `Layout "${presetName}" deleted`,
      });
      loadPresets();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete layout preset",
        variant: "destructive",
      });
    }
  };

  const handleSetAsDefault = async (presetId?: string) => {
    if (user?.role !== 'admin') return;
    
    try {
      await setDefaultLayout(presetId);
      toast({
        title: "Success",
        description: presetId ? "Preset set as default for new users" : "Current layout set as default for new users",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set default layout",
        variant: "destructive",
      });
    }
  };

  const exportLayout = () => {
    const data = {
      presets,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-hub-layouts-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Layout presets exported to file",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Layout Presets</DialogTitle>
          <DialogDescription>
            Save, load, and manage your layout configurations
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Save New Preset */}
          <div className="space-y-2">
            <Label htmlFor="preset-name">Save Current Layout</Label>
            <div className="flex gap-2">
              <Input
                id="preset-name"
                placeholder="Enter preset name..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              />
              <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Existing Presets */}
          <div className="space-y-2">
            <Label>Saved Presets</Label>
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Loading presets...</div>
              ) : presets.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No saved presets</div>
              ) : (
                <div className="space-y-1 p-2">
                  {presets.map((preset) => (
                    <div key={preset.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {preset.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLoadPreset(preset.id, preset.name)}
                          title="Load preset"
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                        {user?.role === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetAsDefault(preset.id)}
                            title="Set as default for new users"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePreset(preset.id, preset.name)}
                          title="Delete preset"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          {user?.role === 'admin' && (
            <div className="space-y-2">
              <Label>Admin Actions</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetAsDefault()}
                  title="Set current layout as default for new users"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Set Current as Default
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportLayout}
                  title="Export all presets to file"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
