import React, { createContext, useContext, useEffect, useState } from 'react';
import { isEmulatorMode, isFirebaseConfigured } from '../config/firebase';
import { authRepository } from '../repositories/authRepository';
import type { AuthSessionState, RegisterableRole } from '../types/domain';

interface AuthContextValue {
  session: AuthSessionState;
  firebaseReady: boolean;
  emulatorMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    fullName: string;
    nickname: string;
    email: string;
    password: string;
    role: RegisterableRole;
    phone?: string;
  }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateFullName: (fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSessionState>(() =>
    isFirebaseConfigured ? { status: 'loading' } : { status: 'signed_out' }
  );

  useEffect(() => {
    const unsubscribe = authRepository.observeSession((nextState) => {
      setSession(nextState);
    });
    return unsubscribe;
  }, []);

  const value: AuthContextValue = {
    session,
    firebaseReady: isFirebaseConfigured,
    emulatorMode: isEmulatorMode,
    signIn: async (email, password) => {
      await authRepository.signInWithEmail(email, password);
    },
    signUp: async (params) => {
      await authRepository.signUpWithEmail(params);
    },
    resetPassword: async (email) => {
      await authRepository.sendPasswordReset(email);
    },
    updateFullName: async (fullName) => {
      if (session.status !== 'ready') return;
      await authRepository.updateFullName(session.profile.uid, fullName);
    },
    signOut: async () => {
      await authRepository.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
