// src/services/firebase.js
// ---------------------------------------------------------------------------
// Firebase app initialisation — lazy, so missing env vars don't crash the
// app at load time before the user has configured .env.local.
// ---------------------------------------------------------------------------

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];
  if (!firebaseConfig.apiKey) {
    throw new Error(
      'Firebase is not configured. Add your VITE_FIREBASE_* variables to .env.local'
    );
  }
  return initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export const googleProvider = new GoogleAuthProvider();
