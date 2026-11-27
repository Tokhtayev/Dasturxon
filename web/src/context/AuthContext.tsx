import React, { useCallback, useEffect, useState } from 'react';
import { isEmulatorMode, isFirebaseConfigured } from '../config/firebase';
import { authRepository } from '../repositories/authRepository';
import { loginNotificationRepository } from '../repositories/loginNotificationRepository';
import type { AuthSessionState, LoginMethod, LoginNotice, UserProfile } from '../types/domain';
import { AuthContext, type AuthContextValue } from './AuthContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSessionState>(() =>
    isFirebaseConfigured ? { status: 'loading' } : { status: 'signed_out' }
  );
  const [loginNotice, setLoginNotice] = useState<LoginNotice | null>(null);

  useEffect(() => {
    const unsubscribe = authRepository.observeSession((nextState) => {
      setSession(nextState);
    });
    return unsubscribe;
  }, []);

  const notifySignIn = useCallback((profile: UserProfile, method: LoginMethod) => {
    const timestampMs = Date.now();
    setLoginNotice({
      email: profile.email,
      role: profile.role,
      fullName: profile.fullName,
      method,
      emailStatus: 'sending',
      timestampMs,
    });
    void loginNotificationRepository
      .sendSignInNotificationEmail({ profile, method })
      .then((emailStatus) => {
        setLoginNotice((prev) =>
          prev && prev.timestampMs === timestampMs ? { ...prev, emailStatus } : prev
        );
      });
  }, []);

  const value: AuthContextValue = {
    session,
    loginNotice,
    dismissLoginNotice: () => setLoginNotice(null),
    firebaseReady: isFirebaseConfigured,
    emulatorMode: isEmulatorMode,
    signIn: async (email, password) => {
      const profile = await authRepository.signInWithEmail(email, password);
      notifySignIn(profile, 'email');
    },
    signInWithGoogle: async (preferredRole, phone) => {
      const outcome = await authRepository.signInWithGoogle({ preferredRole, phone });
      if (outcome.status === 'ready') {
        notifySignIn(outcome.profile, 'google');
      }
      return outcome;
    },
    completeGoogleProfile: async (params) => {
      const profile = await authRepository.completeGoogleProfile(params);
      notifySignIn(profile, 'google');
    },
    signUp: async (params) => {
      const profile = await authRepository.signUpWithEmail(params);
      notifySignIn(profile, 'email');
    },
    resetPassword: async (email) => {
      await authRepository.sendPasswordReset(email);
    },
    updateFullName: async (fullName) => {
      if (session.status !== 'ready') return;
      await authRepository.updateFullName(session.profile.uid, fullName);
    },
    updatePhone: async (phone) => {
      if (session.status !== 'ready') return;
      await authRepository.updatePhone(session.profile.uid, phone);
    },
    signOut: async () => {
      setLoginNotice(null);
      await authRepository.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
