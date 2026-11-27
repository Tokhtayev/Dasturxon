import { FirebaseError } from 'firebase/app';
import {
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Unsubscribe,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '../config/firebase';
import {
  MAX_FULL_NAME_LENGTH,
  MAX_PHONE_LENGTH,
  REGISTRATION_PROFILE_DEBOUNCE_MS,
} from '../services/constants';
import { getReadableErrorMessage } from '../services/errors';
import {
  deriveNicknameCandidates,
  isStrongPassword,
  isValidContactPhone,
  isValidEmail,
  isValidNickname,
  normalizeNickname,
  sanitizeUserText,
} from '../services/validators';
import type { AuthSessionState, RegisterableRole, UserProfile, UserRole } from '../types/domain';

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return Date.now();
}

function mapUserDoc(uid: string, data: Record<string, unknown>): UserProfile {
  const rawRole = data.role;
  const role: UserRole =
    rawRole === 'owner' || rawRole === 'admin' || rawRole === 'customer' ? rawRole : 'customer';
  return {
    uid,
    fullName: typeof data.fullName === 'string' ? data.fullName : '',
    normalizedNickname: typeof data.normalizedNickname === 'string' ? data.normalizedNickname : '',
    email: typeof data.email === 'string' ? data.email : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    role,
    createdAtMs: toMillis(data.createdAt),
  };
}

export function mapAuthErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-email':
        return "Email manzili formati noto'g'ri.";
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return "Email yoki parol noto'g'ri.";
      case 'auth/email-already-in-use':
        return 'Ushbu email bilan hisob allaqachon mavjud.';
      case 'auth/weak-password':
        return "Parol kamida 8 belgi, harf va raqamdan iborat bo'lishi kerak.";
      case 'auth/too-many-requests':
        return "Urinishlar soni ko'p bo'ldi. Birozdan keyin qayta urinib ko'ring.";
      case 'auth/network-request-failed':
        return 'Internet aloqasi yoki Firebase Emulyator ulanishini tekshiring.';
      case 'auth/user-disabled':
        return 'Ushbu hisob vaqtincha bloklangan.';
      case 'auth/popup-closed-by-user':
        return "Google oynasi yopildi. Qaytadan urinib ko'ring.";
      case 'auth/popup-blocked':
        return 'Brauzer Google kirish oynasini blokladi. Pop-up oynalarga ruxsat bering.';
      case 'auth/operation-not-allowed':
        return 'Firebase Console -> Authentication -> Sign-in method bo‘limida Google bilan kirish yoqilmagan.';
      case 'auth/unauthorized-domain':
        return 'Ushbu sayt domeni Firebase Console Authorized domains ro‘yxatiga qo‘shilmagan.';
      case 'auth/account-exists-with-different-credential':
        return 'Ushbu email boshqa usul bilan ro‘yxatdan o‘tgan. Email va parol bilan kiring.';
      case 'permission-denied':
        return "Ruxsat cheklangan yoki hisob ma'lumotlariga kirish taqiqlangan.";
      default:
        return getReadableErrorMessage(err, "Tizimda xatolik yuz berdi. Qayta urinib ko'ring.");
    }
  }
  return getReadableErrorMessage(err, 'Tizimda kutilmagan xatolik yuz berdi.');
}

export const authRepository = {
  observeSession(onState: (state: AuthSessionState) => void): Unsubscribe {
    if (!isFirebaseConfigured) {
      onState({ status: 'signed_out' });
      return () => {};
    }

    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    let profileUnsub: Unsubscribe | null = null;
    let missingTimer: ReturnType<typeof setTimeout> | null = null;

    const authUnsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }
      if (missingTimer) {
        clearTimeout(missingTimer);
        missingTimer = null;
      }

      if (!firebaseUser) {
        onState({ status: 'signed_out' });
        return;
      }

      onState({ status: 'loading' });
      const userRef = doc(db, 'users', firebaseUser.uid);

      // Observer pattern on user profile doc; read failure never causes false sign-out
      profileUnsub = onSnapshot(
        userRef,
        (snap) => {
          if (missingTimer) {
            clearTimeout(missingTimer);
            missingTimer = null;
          }
          if (snap.exists()) {
            onState({
              status: 'ready',
              profile: mapUserDoc(firebaseUser.uid, snap.data() as Record<string, unknown>),
            });
          } else {
            // Avoid flashing profile_missing during the brief window between Auth creation and batch commit
            missingTimer = setTimeout(() => {
              onState({
                status: 'profile_missing',
                uid: firebaseUser.uid,
                email: firebaseUser.email ?? '',
                displayName: firebaseUser.displayName ?? '',
              });
            }, REGISTRATION_PROFILE_DEBOUNCE_MS);
          }
        },
        (error) => {
          if (missingTimer) {
            clearTimeout(missingTimer);
            missingTimer = null;
          }
          onState({ status: 'error', message: mapAuthErrorMessage(error) });
        }
      );
    });

    return () => {
      if (missingTimer) clearTimeout(missingTimer);
      if (profileUnsub) profileUnsub();
      authUnsub();
    };
  },

  async signInWithEmail(email: string, password: string): Promise<UserProfile> {
    if (!isValidEmail(email) || !password) {
      throw new Error("To'g'ri email va parol kiriting.");
    }
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!snap.exists()) {
        throw new Error('Foydalanuvchi profili Firestore bazasida topilmadi.');
      }
      return mapUserDoc(cred.user.uid, snap.data() as Record<string, unknown>);
    } catch (error) {
      throw new Error(mapAuthErrorMessage(error));
    }
  },

  async completeGoogleProfile(params: {
    fullName: string;
    nickname: string;
    role: RegisterableRole;
    phone?: string;
  }): Promise<UserProfile> {
    const currentUser = getFirebaseAuth().currentUser;
    if (!currentUser?.email) {
      throw new Error('Avval Google hisobingiz bilan kiring.');
    }
    const cleanFullName = sanitizeUserText(params.fullName, MAX_FULL_NAME_LENGTH);
    const cleanPhone = sanitizeUserText(params.phone ?? '', MAX_PHONE_LENGTH);
    const normalized = normalizeNickname(params.nickname);
    if (!cleanFullName || cleanFullName.length < 2) {
      throw new Error("To'liq ism kamida 2 belgidan iborat bo'lishi kerak.");
    }
    if (!isValidNickname(normalized)) {
      throw new Error('Nickname 3-20 ta kichik lotin harf, raqam, _ yoki . bo‘lsin.');
    }
    if (params.role === 'owner' && !isValidContactPhone(cleanPhone)) {
      throw new Error("Biznes egasi uchun admin bog'lanadigan telefon raqami majburiy.");
    }

    const db = getFirebaseDb();
    try {
      const existing = await getDoc(doc(db, 'usernames', normalized));
      if (existing.exists()) {
        throw new Error('Ushbu nickname allaqachon band. Boshqa nom tanlang.');
      }
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', currentUser.uid), {
        fullName: cleanFullName,
        normalizedNickname: normalized,
        email: currentUser.email,
        phone: cleanPhone,
        role: params.role,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, 'usernames', normalized), {
        uid: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      await batch.commit();

      return {
        uid: currentUser.uid,
        fullName: cleanFullName,
        normalizedNickname: normalized,
        email: currentUser.email,
        phone: cleanPhone,
        role: params.role,
        createdAtMs: Date.now(),
      };
    } catch (error) {
      throw new Error(mapAuthErrorMessage(error));
    }
  },

  async signInWithGoogle(params?: {
    preferredRole?: RegisterableRole;
    phone?: string;
  }): Promise<
    | { status: 'ready'; profile: UserProfile }
    | { status: 'needs_profile'; uid: string; email: string; displayName: string }
  > {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const cred = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
      if (userSnap.exists()) {
        return {
          status: 'ready',
          profile: mapUserDoc(cred.user.uid, userSnap.data() as Record<string, unknown>),
        };
      }

      const cleanPhone = sanitizeUserText(params?.phone ?? '', MAX_PHONE_LENGTH);
      const canAutoCreate =
        params?.preferredRole === 'customer' ||
        (params?.preferredRole === 'owner' && isValidContactPhone(cleanPhone));

      if (!canAutoCreate || !params?.preferredRole) {
        return {
          status: 'needs_profile',
          uid: cred.user.uid,
          email: cred.user.email ?? '',
          displayName: cred.user.displayName ?? '',
        };
      }

      const candidates = deriveNicknameCandidates(cred.user.email ?? '', cred.user.uid);
      let freeNick = candidates[candidates.length - 1] ?? 'dasturxon_user';
      for (const candidate of candidates) {
        const nickSnap = await getDoc(doc(db, 'usernames', candidate));
        if (!nickSnap.exists()) {
          freeNick = candidate;
          break;
        }
      }

      const rawName = sanitizeUserText(
        cred.user.displayName || cred.user.email?.split('@')[0] || 'Foydalanuvchi',
        MAX_FULL_NAME_LENGTH
      );
      const fullName = rawName.length >= 2 ? rawName : 'Foydalanuvchi';
      const profile = await this.completeGoogleProfile({
        fullName,
        nickname: freeNick,
        role: params.preferredRole,
        phone: cleanPhone,
      });
      return { status: 'ready', profile };
    } catch (error) {
      throw new Error(mapAuthErrorMessage(error));
    }
  },

  async signUpWithEmail(params: {
    fullName: string;
    nickname: string;
    email: string;
    password: string;
    role: RegisterableRole;
    phone?: string;
  }): Promise<UserProfile> {
    const cleanFullName = sanitizeUserText(params.fullName, MAX_FULL_NAME_LENGTH);
    const cleanPhone = sanitizeUserText(params.phone ?? '', MAX_PHONE_LENGTH);
    const normalized = normalizeNickname(params.nickname);
    if (
      !cleanFullName ||
      !isValidNickname(normalized) ||
      !isValidEmail(params.email) ||
      !isStrongPassword(params.password)
    ) {
      throw new Error("Ro'yxatdan o'tish ma'lumotlari xavfsizlik talablariga javob bermaydi.");
    }
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();

    try {
      // 1. Create Auth user first so Firestore security rules see isSignedIn() == true
      const cred = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
      const uid = cred.user.uid;
      const usernameRef = doc(db, 'usernames', normalized);
      const userRef = doc(db, 'users', uid);

      try {
        // 2. Check atomic nickname uniqueness while authenticated
        const existingHandle = await getDoc(usernameRef);
        if (existingHandle.exists()) {
          throw new Error('Ushbu nickname allaqachon band. Boshqa nom tanlang.');
        }

        // 3. Atomic WriteBatch to users/{uid} and usernames/{normalized}
        const batch = writeBatch(db);
        batch.set(userRef, {
          fullName: cleanFullName,
          normalizedNickname: normalized,
          email: params.email.trim(),
          phone: cleanPhone,
          role: params.role,
          createdAt: serverTimestamp(),
        });
        batch.set(usernameRef, {
          uid,
          createdAt: serverTimestamp(),
        });

        await batch.commit();
      } catch (firestoreErr) {
        // Atomic rollback of Auth user if nickname is taken or Firestore batch fails
        try {
          await deleteUser(cred.user);
        } catch {
          // ignore rollback cleanup failure
        }
        throw firestoreErr;
      }

      return {
        uid,
        fullName: cleanFullName,
        normalizedNickname: normalized,
        email: params.email.trim(),
        phone: cleanPhone,
        role: params.role,
        createdAtMs: Date.now(),
      };
    } catch (error) {
      throw new Error(mapAuthErrorMessage(error));
    }
  },

  async sendPasswordReset(email: string): Promise<void> {
    if (!isValidEmail(email)) {
      throw new Error("To'g'ri email manzilini kiriting.");
    }
    const auth = getFirebaseAuth();
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      // Anti-enumeration: user-not-found behaves identically to success
      if (error instanceof FirebaseError && error.code === 'auth/user-not-found') {
        return;
      }
      throw new Error(mapAuthErrorMessage(error));
    }
  },

  async updateFullName(uid: string, fullName: string): Promise<void> {
    const cleanName = sanitizeUserText(fullName, MAX_FULL_NAME_LENGTH);
    if (!cleanName) throw new Error("To'liq ism bo'sh bo'lmasligi kerak.");
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'users', uid), { fullName: cleanName });
  },

  async updatePhone(uid: string, phone: string): Promise<void> {
    const cleanPhone = sanitizeUserText(phone, MAX_PHONE_LENGTH);
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'users', uid), { phone: cleanPhone });
  },

  async signOut(): Promise<void> {
    if (!isFirebaseConfigured) return;
    await signOut(getFirebaseAuth());
  },
};
