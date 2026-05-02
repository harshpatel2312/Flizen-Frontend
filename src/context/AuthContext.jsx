// src/context/AuthContext.jsx
// ---------------------------------------------------------------------------
// Central auth state provider using Firebase onAuthStateChanged.
// Wrap the app with <AuthProvider> once; consume with useAuth() anywhere.
// ---------------------------------------------------------------------------

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../services/firebase';

const AuthContext = createContext(null);

/**
 * Provides auth state to the component tree.
 *
 * user === undefined  →  auth state is still being determined (loading)
 * user === null       →  no signed-in user
 * user === User       →  Firebase User object for the signed-in user
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const auth = getFirebaseAuth();
    // onAuthStateChanged returns an unsubscribe function.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
    });
    return unsubscribe;
  }, []);

  const loading = user === undefined;

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context. Must be used inside <AuthProvider>.
 * Returns { user, loading }
 *   - user: Firebase User | null
 *   - loading: boolean (true while Firebase resolves the session)
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
