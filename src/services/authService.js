// src/services/authService.js
// ---------------------------------------------------------------------------
// Auth helpers used by LoginPage and SignUpPage.
// ---------------------------------------------------------------------------

import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirebaseAuth, googleProvider } from './firebase';
import { clearFlowMemory } from '../utils/bookingFlowMemory';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Map Firebase Auth error codes to safe user-facing messages.
// Never expose raw err.message — it can contain internal SDK details.
function friendlyAuthError(err) {
  const code = err?.code || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Sign-in was cancelled. Please try again.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Pop-up was blocked by your browser. Please allow pop-ups for this site.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your connection and try again.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  // Fallback — do not forward err.message
  return 'Sign-in failed. Please try again.';
}

/**
 * Sign in with Google popup, then verify the ID token with the backend.
 * Returns the user profile returned by the backend.
 */
export async function signInWithGoogle() {
  let result;
  try {
    result = await signInWithPopup(getFirebaseAuth(), googleProvider);
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
  const idToken = await result.user.getIdToken();
  return verifyTokenWithBackend(idToken);
}

/**
 * Send the Firebase ID token to the backend for verification.
 * The backend returns { uid, email, name, picture }.
 */
async function verifyTokenWithBackend(idToken) {
  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Authentication failed');
  }

  return response.json(); // { uid, email, name, picture }
}

/**
 * Sign out from Firebase.
 */
export async function signOut() {
  clearFlowMemory();
  await firebaseSignOut(getFirebaseAuth());
}
