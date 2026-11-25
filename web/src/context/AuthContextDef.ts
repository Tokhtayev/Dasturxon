import { createContext } from 'react';
import type { AuthSessionState, RegisterableRole } from '../types/domain';

export interface AuthContextValue {
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

export const AuthContext = createContext<AuthContextValue | null>(null);
