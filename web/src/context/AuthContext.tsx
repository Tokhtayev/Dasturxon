import React, { useEffect, useState } from 'react';
import { isEmulatorMode, isFirebaseConfigured } from '../config/firebase';
import { authRepository } from '../repositories/authRepository';
import type { AuthSessionState } from '../types/domain';
import { AuthContext, type AuthContextValue } from './AuthContextDef';

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
