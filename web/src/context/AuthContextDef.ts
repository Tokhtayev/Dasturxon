import { createContext } from 'react';
import type { AuthSessionState, LoginNotice, RegisterableRole, UserProfile } from '../types/domain';

export type GoogleSignInOutcome =
  | { status: 'ready'; profile: UserProfile }
  | { status: 'needs_profile'; uid: string; email: string; displayName: string };

export interface AuthContextValue {
  session: AuthSessionState;
  loginNotice: LoginNotice | null;
  dismissLoginNotice: () => void;
  firebaseReady: boolean;
  emulatorMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (
    preferredRole?: RegisterableRole,
    phone?: string
  ) => Promise<GoogleSignInOutcome>;
  completeGoogleProfile: (params: {
    fullName: string;
    nickname: string;
    role: RegisterableRole;
    phone?: string;
  }) => Promise<void>;
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
  updatePhone: (phone: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
