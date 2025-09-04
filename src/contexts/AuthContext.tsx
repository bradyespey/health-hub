import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebaseConfig';

export type UserRole = 'admin' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  preferences?: {
    sidebarState?: 'expanded' | 'collapsed' | 'hover';
    theme?: 'dark' | 'light' | 'system';
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserPreferences: (preferences: Partial<User['preferences']>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch/create user doc
        await handleUserSignIn(firebaseUser);
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUserSignIn = async (firebaseUser: FirebaseUser) => {
    try {
      // Check if user email is in approved list
      const approvedEmails = [
        'baespey@gmail.com',
        'bradyjennytx@gmail.com', 
        'jennycespey@gmail.com'
      ];

      const userEmail = firebaseUser.email || '';
      
      if (!approvedEmails.includes(userEmail)) {
        // User not approved, sign them out
        console.log('Unauthorized email attempted sign in:', userEmail);
        await firebaseSignOut(auth);
        alert('Access denied. This app is restricted to authorized users only.');
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      let userData: User;

      if (userDoc.exists()) {
        // User exists, get their data
        const existingData = userDoc.data();
        userData = {
          id: firebaseUser.uid,
          email: userEmail,
          name: firebaseUser.displayName || '',
          role: existingData.role || 'viewer',
          avatar: firebaseUser.photoURL || undefined,
          preferences: existingData.preferences || {
            sidebarState: 'expanded',
            theme: 'system'
          }
        };

        // Update last login
        await setDoc(userDocRef, {
          ...existingData,
          lastLoginAt: new Date()
        }, { merge: true });
      } else {
        // New approved user, create user document
        // Set role based on email - admins can edit, viewers can only view
        const adminEmails = [
          'baespey@gmail.com',
          'jennycespey@gmail.com', 
          'bradyjennytx@gmail.com'
        ];
        const role = adminEmails.includes(userEmail) ? 'admin' : 'viewer';
        
        userData = {
          id: firebaseUser.uid,
          email: userEmail,
          name: firebaseUser.displayName || '',
          role: role,
          avatar: firebaseUser.photoURL || undefined
        };

        // Create user document in Firestore with default preferences
        await setDoc(userDocRef, {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          preferences: {
            sidebarState: 'expanded',
            theme: 'system'
          },
          createdAt: new Date(),
          lastLoginAt: new Date()
        });
      }

      setUser(userData);
    } catch (error) {
      console.error('Error handling user sign in:', error);
      setLoading(false);
    }
  };

  const signIn = async (): Promise<void> => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error('Error signing in:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle clearing the user
    } catch (error) {
      console.error('Error signing out:', error);
      setLoading(false);
      throw error;
    }
  };

  const updateUserPreferences = async (preferences: Partial<User['preferences']>): Promise<void> => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.id);
      const updatedPreferences = {
        ...user.preferences,
        ...preferences
      };

      await setDoc(userDocRef, {
        preferences: updatedPreferences
      }, { merge: true });

      setUser({
        ...user,
        preferences: updatedPreferences
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUserPreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthSafe() {
  const context = useContext(AuthContext);
  return context || { user: null, updateUserPreferences: null };
}