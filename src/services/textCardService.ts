import { collection, doc, setDoc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

export interface TextCardData {
  id: string;
  title: string;
  description?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  page: string;
}

export class TextCardService {
  /**
   * Save text card to Firestore
   */
  static async saveTextCard(
    userId: string,
    cardId: string,
    data: {
      title: string;
      description?: string;
      content: string;
      page: string;
    }
  ): Promise<void> {
    try {
      const cardRef = doc(db, 'textCards', userId, data.page, cardId);
      
      // Check if card exists to determine if it's new or updated
      const existingCard = await getDoc(cardRef);
      const isNewCard = !existingCard.exists();
      
      const cardData: Partial<TextCardData> = {
        title: data.title,
        description: data.description,
        content: data.content,
        updatedAt: new Date(),
        createdBy: userId,
        page: data.page
      };

      if (isNewCard) {
        cardData.createdAt = new Date();
      }

      await setDoc(cardRef, cardData, { merge: true });
    } catch (error) {
      console.error('Error saving text card:', error);
      throw new Error('Failed to save text card');
    }
  }

  /**
   * Load text card from Firestore
   */
  static async loadTextCard(
    userId: string,
    cardId: string,
    page: string
  ): Promise<TextCardData | null> {
    try {
      const cardRef = doc(db, 'textCards', userId, page, cardId);
      const cardDoc = await getDoc(cardRef);
      
      if (cardDoc.exists()) {
        const data = cardDoc.data();
        return {
          id: cardId,
          title: data.title,
          description: data.description,
          content: data.content,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdBy: data.createdBy,
          page: data.page
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading text card:', error);
      throw new Error('Failed to load text card');
    }
  }

  /**
   * Load all text cards for a user on a specific page
   */
  static async loadTextCardsForPage(
    userId: string,
    page: string
  ): Promise<TextCardData[]> {
    try {
      const cardsSnapshot = await getDocs(collection(db, 'textCards', userId, page));
      
      return cardsSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        content: doc.data().content,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        createdBy: doc.data().createdBy,
        page: doc.data().page
      }));
    } catch (error) {
      console.error('Error loading text cards for page:', error);
      return [];
    }
  }

  /**
   * Load all text cards for a user across all pages
   */
  static async loadAllTextCards(userId: string): Promise<TextCardData[]> {
    const pageTypes = ['dashboard', 'readiness', 'nutrition', 'hydration', 'training', 'habits', 'goals'];
    const allCards: TextCardData[] = [];

    for (const page of pageTypes) {
      try {
        const pageCards = await this.loadTextCardsForPage(userId, page);
        allCards.push(...pageCards);
      } catch (error) {
        console.warn(`Failed to load text cards for page ${page}:`, error);
      }
    }

    return allCards;
  }

  /**
   * Delete text card from Firestore
   */
  static async deleteTextCard(
    userId: string,
    cardId: string,
    page: string
  ): Promise<void> {
    try {
      const cardRef = doc(db, 'textCards', userId, page, cardId);
      await deleteDoc(cardRef);
    } catch (error) {
      console.error('Error deleting text card:', error);
      throw new Error('Failed to delete text card');
    }
  }

  /**
   * Get current page from location pathname
   */
  static getPageFromLocation(pathname: string): string {
    if (pathname === '/') return 'dashboard';
    const page = pathname.split('/')[1];
    return page || 'dashboard';
  }

  /**
   * Check if a card ID is a text card
   */
  static isTextCard(cardId: string): boolean {
    return cardId.startsWith('text-card-');
  }
}
