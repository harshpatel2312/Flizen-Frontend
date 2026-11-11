// src/utils/bookingFlowMemory.js
// ---------------------------------------------------------------------------
// Short-lived memory for selections made in the booking flow (flight list,
// passenger details, seat selection) so they survive browser Back/Forward.
//
// - sessionStorage only: scoped to this tab, gone when the tab closes.
// - Entries expire after FLOW_MEMORY_TTL_MS and are cleared on sign-out.
// - Each entry is keyed by search / offer so a new search never inherits
//   selections from a previous one.
// - NEVER store payment data here (card details, PaymentIntent secrets, etc.).
// ---------------------------------------------------------------------------

const PREFIX = 'flizen_flow:';
export const FLOW_MEMORY_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function rememberFlowState(key, value) {
  if (!key) return;
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ savedAt: Date.now(), value }));
  } catch {
    // Storage full or unavailable — memory is best-effort.
  }
}

export function recallFlowState(key) {
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { savedAt, value } = JSON.parse(raw);
    if (!savedAt || Date.now() - savedAt > FLOW_MEMORY_TTL_MS) {
      sessionStorage.removeItem(PREFIX + key);
      return null;
    }
    return value ?? null;
  } catch {
    return null;
  }
}

export function clearFlowMemory() {
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/** Stable key for a selected itinerary (one Duffel offer). */
export function offerMemoryKey(flight) {
  return flight ? flight.offerId || flight.id || null : null;
}
