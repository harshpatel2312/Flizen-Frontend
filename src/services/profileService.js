// src/services/profileService.js
// ---------------------------------------------------------------------------
// Profile read/write — all requests go through the FastAPI backend.
// The backend holds the Firestore credentials; the frontend never touches
// Firestore directly and never exposes service-account secrets.
//
// Every request includes the user's short-lived Firebase ID token in the
// Authorization header. The backend verifies it, extracts the uid, and
// scopes the Firestore read/write to that uid only.
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function authHeaders(user) {
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Fetch the profile for the signed-in user.
 * Returns the profile object, or {} if none has been saved yet.
 *
 * @param {import('firebase/auth').User} user - Firebase User object
 */
export async function fetchProfile(user) {
  if (!user) throw new Error('user is required');
  const res = await fetch(`${API_BASE}/profile`, {
    headers: await authHeaders(user),
  });
  if (!res.ok) throw new Error(`Failed to fetch profile: ${res.statusText}`);
  return res.json();
}

/**
 * Persist the profile for the signed-in user.
 * Uses PUT with merge semantics on the backend (existing fields are preserved).
 *
 * @param {import('firebase/auth').User} user - Firebase User object
 * @param {{ personal, contact, preferences, passport }} profile
 */
export async function saveProfile(user, { personal, contact, preferences, passport }) {
  if (!user) throw new Error('user is required');
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: await authHeaders(user),
    body: JSON.stringify({ personal, contact, preferences, passport }),
  });
  if (!res.ok) throw new Error(`Failed to save profile: ${res.statusText}`);
}
