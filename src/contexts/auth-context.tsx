"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isEmailVerified: false,
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] 🔄 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log('[Auth] ✅ User authenticated:', currentUser.email);
        console.log('[Auth] 📧 Email verified:', currentUser.emailVerified);
        setUser(currentUser);
      } else {
        console.log('[Auth] ℹ️ No user authenticated');
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('[Auth] 🛑 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    isEmailVerified: user?.emailVerified ?? false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
