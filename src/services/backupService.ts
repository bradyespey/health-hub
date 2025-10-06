import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { CardLayout, LayoutPreset } from '@/contexts/LayoutContext';
import { TextCardService, TextCardData } from './textCardService';

// TextCardData interface now imported from textCardService

export interface BackupData {
  version: string;
  backupDate: string;
  userId: string;
  userEmail: string;
  data: {
    layouts: {
      current: CardLayout[];
      presets: LayoutPreset[];
    };
    textCards: TextCardData[];
    systemSettings?: any;
  };
}

export interface BackupMetadata {
  id: string;
  name: string;
  date: Date;
  size: number;
  userId: string;
  type: 'manual' | 'automatic';
  googleDriveFileId?: string;
}

export class BackupService {
  private static readonly BACKUP_VERSION = '1.0.0';
  private static readonly GOOGLE_DRIVE_FOLDER_ID = '15Wi50X5XOuAOubOjlvioQ61m_J4QF1yB';

  /**
   * Create a complete backup of user data
   */
  static async createBackup(userId: string, userEmail: string, type: 'manual' | 'automatic' = 'manual'): Promise<BackupData> {

    try {
      // Get current layouts
      const layoutDoc = await getDoc(doc(db, 'layouts', userId, 'pages', 'dashboard'));
      const currentLayouts = layoutDoc.exists() ? layoutDoc.data().layouts as CardLayout[] : [];

      // Get layout presets
      const presetsSnapshot = await getDocs(collection(db, 'layouts', userId, 'presets'));
      const presets: LayoutPreset[] = presetsSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as LayoutPreset[];

      // Get all text cards using the service
      const textCards = await TextCardService.loadAllTextCards(userId);

      // Get system settings if user is admin
      let systemSettings = null;
      try {
        const settingsDoc = await getDoc(doc(db, 'system', 'settings'));
        if (settingsDoc.exists()) {
          systemSettings = settingsDoc.data();
        }
      } catch (error) {
        console.warn('Could not fetch system settings');
      }

      const backupData: BackupData = {
        version: this.BACKUP_VERSION,
        backupDate: new Date().toISOString(),
        userId,
        userEmail,
        data: {
          layouts: {
            current: currentLayouts,
            presets
          },
          textCards,
          systemSettings
        }
      };

      return backupData;

    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup: ' + (error as Error).message);
    }
  }

  /**
   * Export backup data as downloadable JSON file
   */
  static downloadBackup(backupData: BackupData, filename?: string): void {
    const defaultFilename = `health-hub-backup-${backupData.backupDate.split('T')[0]}.json`;
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Upload backup to Google Drive (requires Cloud Function)
   */
  static async uploadToGoogleDrive(backupData: BackupData): Promise<string> {
    try {
      const response = await fetch('/api/backup-to-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backupData,
          folderId: this.GOOGLE_DRIVE_FOLDER_ID
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.fileId;
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      throw new Error('Failed to upload backup to Google Drive');
    }
  }

  /**
   * Restore data from backup file
   */
  static async restoreFromBackup(
    backupData: BackupData, 
    userId: string,
    options: {
      restoreLayouts?: boolean;
      restorePresets?: boolean;
      restoreTextCards?: boolean;
      overwriteExisting?: boolean;
    } = {}
  ): Promise<void> {
    const {
      restoreLayouts = true,
      restorePresets = true,
      restoreTextCards = true,
      overwriteExisting = false
    } = options;

    try {
      // Restore current layouts
      if (restoreLayouts && backupData.data.layouts.current.length > 0) {
        await setDoc(doc(db, 'layouts', userId, 'pages', 'dashboard'), {
          layouts: backupData.data.layouts.current,
          updatedAt: new Date(),
          restoredAt: new Date()
        });
      }

      // Restore layout presets
      if (restorePresets && backupData.data.layouts.presets.length > 0) {
        for (const preset of backupData.data.layouts.presets) {
          await setDoc(doc(db, 'layouts', userId, 'presets', preset.id), {
            ...preset,
            restoredAt: new Date()
          });
        }
      }

      // Restore text cards
      if (restoreTextCards && backupData.data.textCards.length > 0) {
        for (const card of backupData.data.textCards) {
          if (!overwriteExisting) {
            // Check if card already exists
            const existingCard = await TextCardService.loadTextCard(userId, card.id, card.page);
            if (existingCard) {
              continue;
            }
          }

          // Restore the text card
          await TextCardService.saveTextCard(userId, card.id, {
            title: card.title,
            description: card.description,
            content: card.content,
            page: card.page
          });
        }
      }
    } catch (error) {
      console.error('Error during restore:', error);
      throw new Error('Failed to restore backup: ' + (error as Error).message);
    }
  }

  /**
   * Validate backup file format
   */
  static validateBackup(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.version) {
      errors.push('Missing backup version');
    }

    if (!data.backupDate) {
      errors.push('Missing backup date');
    }

    if (!data.userId) {
      errors.push('Missing user ID');
    }

    if (!data.data) {
      errors.push('Missing backup data');
    } else {
      if (!data.data.layouts) {
        errors.push('Missing layouts data');
      }
      
      if (!Array.isArray(data.data.textCards)) {
        errors.push('Text cards data is not an array');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get backup statistics
   */
  static getBackupStats(backupData: BackupData): {
    textCardsCount: number;
    presetsCount: number;
    layoutsCount: number;
    totalSize: string;
    pages: string[];
  } {
    const textCardsCount = backupData.data.textCards.length;
    const presetsCount = backupData.data.layouts.presets.length;
    const layoutsCount = backupData.data.layouts.current.length;
    
    const sizeInBytes = JSON.stringify(backupData).length;
    const totalSize = (sizeInBytes / 1024).toFixed(2) + ' KB';
    
    const pages = [...new Set(backupData.data.textCards.map(card => card.page || 'dashboard'))];

    return {
      textCardsCount,
      presetsCount,
      layoutsCount,
      totalSize,
      pages
    };
  }
}
