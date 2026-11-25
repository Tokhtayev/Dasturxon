import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

export const isFirebaseConfigured =
  useEmulator ||
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId &&
      !firebaseConfig.apiKey.startsWith('demo-')
  );

export const isEmulatorMode = useEmulator;

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let emulatorsConnected = false;

function ensureInitialized(): void {
  if (!isFirebaseConfigured) return;
  if (!appInstance) {
    appInstance =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp(
            useEmulator
              ? {
                  apiKey: firebaseConfig.apiKey || 'demo-dasturxon-api-key',
                  authDomain: firebaseConfig.authDomain || 'demo-dasturxon.firebaseapp.com',
                  projectId: firebaseConfig.projectId || 'demo-dasturxon',
                  appId: firebaseConfig.appId || '1:437798898747:web:demo',
                }
              : firebaseConfig
          );
  }
  if (!authInstance) {
    authInstance = getAuth(appInstance);
  }
  if (!dbInstance) {
    dbInstance = getFirestore(appInstance);
  }
  if (useEmulator && !emulatorsConnected && authInstance && dbInstance) {
    connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080);
    emulatorsConnected = true;
  }
}

export function getFirebaseAuth(): Auth {
  ensureInitialized();
  if (!authInstance) {
    throw new Error('Firebase Authentication sozlanmagan. .env faylini tekshiring.');
  }
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  ensureInitialized();
  if (!dbInstance) {
    throw new Error('Cloud Firestore sozlanmagan. .env faylini tekshiring.');
  }
  return dbInstance;
}
