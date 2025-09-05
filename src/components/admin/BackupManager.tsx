import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { BackupService, BackupData } from '@/services/backupService';
import { 
  Download, 
  Upload, 
  HardDrive, 
  FileText, 
  Layers, 
  Database,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function BackupManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<BackupData | null>(null);
  const [restoreOptions, setRestoreOptions] = useState({
    restoreLayouts: true,
    restorePresets: true,
    restoreTextCards: true,
    overwriteExisting: false
  });

  const handleCreateBackup = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const backupData = await BackupService.createBackup(user.id, user.email, 'manual');
      const stats = BackupService.getBackupStats(backupData);
      
      // Download backup file
      BackupService.downloadBackup(backupData);
      
      toast({
        title: "Backup Created",
        description: `Backup saved: ${stats.textCardsCount} text cards, ${stats.presetsCount} presets (${stats.totalSize})`,
      });

      // Try to upload to Google Drive (will fail gracefully if not configured)
      try {
        await BackupService.uploadToGoogleDrive(backupData);
        toast({
          title: "Cloud Backup",
          description: "Backup also saved to Google Drive",
        });
      } catch (error) {
        console.warn('Google Drive upload failed:', error);
        // Don't show error to user as local backup succeeded
      }

    } catch (error) {
      console.error('Backup creation failed:', error);
      toast({
        title: "Backup Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        const validation = BackupService.validateBackup(backupData);
        
        if (!validation.valid) {
          toast({
            title: "Invalid Backup File",
            description: validation.errors.join(', '),
            variant: "destructive",
          });
          return;
        }

        setBackupToRestore(backupData);
        setRestoreDialogOpen(true);
      } catch (error) {
        toast({
          title: "Error Reading File",
          description: "Invalid JSON file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleRestore = async () => {
    if (!backupToRestore || !user) return;

    setLoading(true);
    try {
      await BackupService.restoreFromBackup(backupToRestore, user.id, restoreOptions);
      
      toast({
        title: "Restore Completed",
        description: "Data has been restored successfully. Refresh the page to see changes.",
      });
      
      setRestoreDialogOpen(false);
      setBackupToRestore(null);
    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: "Restore Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBackupStats = () => {
    if (!backupToRestore) return null;
    return BackupService.getBackupStats(backupToRestore);
  };

  const stats = getBackupStats();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Backup & Restore
          </CardTitle>
          <CardDescription>
            Backup text cards, layouts, and settings. Automatic backups are saved to Google Drive daily.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create Backup */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Create Backup</Label>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleCreateBackup} 
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Create Backup
              </Button>
              <Badge variant="outline" className="gap-1">
                <HardDrive className="h-3 w-3" />
                Auto-saves to Google Drive
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Downloads a JSON file and uploads to Google Drive backup folder
            </p>
          </div>

          {/* Restore from File */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Restore from Backup</Label>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Select Backup File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Select a backup JSON file to restore your data
            </p>
          </div>

          {/* Backup Info */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Backup Information
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Text cards contain your notes, goals, and custom content</li>
              <li>• Layouts include dashboard arrangements and saved presets</li>
              <li>• Backups are automatically created daily at 2 AM</li>
              <li>• Manual backups are recommended before major changes</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Restore Backup</DialogTitle>
            <DialogDescription>
              Review the backup contents and select what to restore
            </DialogDescription>
          </DialogHeader>

          {stats && (
            <div className="space-y-4">
              {/* Backup Stats */}
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-medium">{stats.textCardsCount}</div>
                    <div className="text-xs text-muted-foreground">Text Cards</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-medium">{stats.presetsCount}</div>
                    <div className="text-xs text-muted-foreground">Layout Presets</div>
                  </div>
                </div>
              </div>

              {/* Backup Details */}
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Backup Date:</span> {new Date(backupToRestore!.backupDate).toLocaleString()}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Size:</span> {stats.totalSize}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Pages:</span> {stats.pages.join(', ')}
                </div>
              </div>

              {/* Restore Options */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Restore Options</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="restore-layouts"
                      checked={restoreOptions.restoreLayouts}
                      onCheckedChange={(checked) => 
                        setRestoreOptions(prev => ({ ...prev, restoreLayouts: checked as boolean }))
                      }
                    />
                    <Label htmlFor="restore-layouts" className="text-sm">
                      Restore current dashboard layout ({stats.layoutsCount} cards)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="restore-presets"
                      checked={restoreOptions.restorePresets}
                      onCheckedChange={(checked) => 
                        setRestoreOptions(prev => ({ ...prev, restorePresets: checked as boolean }))
                      }
                    />
                    <Label htmlFor="restore-presets" className="text-sm">
                      Restore layout presets ({stats.presetsCount} presets)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="restore-text-cards"
                      checked={restoreOptions.restoreTextCards}
                      onCheckedChange={(checked) => 
                        setRestoreOptions(prev => ({ ...prev, restoreTextCards: checked as boolean }))
                      }
                    />
                    <Label htmlFor="restore-text-cards" className="text-sm">
                      Restore text cards ({stats.textCardsCount} cards)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="overwrite-existing"
                      checked={restoreOptions.overwriteExisting}
                      onCheckedChange={(checked) => 
                        setRestoreOptions(prev => ({ ...prev, overwriteExisting: checked as boolean }))
                      }
                    />
                    <Label htmlFor="overwrite-existing" className="text-sm">
                      Overwrite existing data (if unchecked, only restores missing items)
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRestore} 
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Restore Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
