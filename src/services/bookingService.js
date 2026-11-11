// src/services/bookingService.js
// ---------------------------------------------------------------------------
// Booking-draft API + payload builder.
// All calls go through the backend and carry a Firebase ID token.
// ---------------------------------------------------------------------------

import { getFirebaseAuth } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function authHeaders() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('You must be signed in to continue.');
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function readError(res, fallback) {
  try {
    const j = await res.json();
    return j?.detail || fallback;
  } catch {
    return fallback;
  }
}

/** Shape the frontend traveler + seat state into the backend draft payload. */
export function buildDraftPayload({
  flight,
  searchCriteria,
  passengers,
  contact,
  selectedSeats,
}) {
  const adults   = parseInt(searchCriteria?.passengers?.adults   ?? 1, 10);
  const children = parseInt(searchCriteria?.passengers?.children ?? 0, 10);
  const infants  = parseInt(searchCriteria?.passengers?.infants  ?? 0, 10);

  const types = [
    ...Array(adults).fill('adult'),
    ...Array(children).fill('child'),
    ...Array(infants).fill('infant'),
  ];

  const apiPassengers = (passengers || []).map((p, i) => ({
    type:        types[i] || 'adult',
    given_name:  (p.firstName || '').trim(),
    family_name: (p.lastName  || '').trim(),
    // DatePickerDOB already emits YYYY-MM-DD strings.
    born_on:     (p.dob       || '').trim(),
    gender:      (p.gender    || 'unknown').toLowerCase(),
  }));

  const seat_preferences = [];
  if (selectedSeats && typeof selectedSeats === 'object') {
    for (const [segmentKey, seats] of Object.entries(selectedSeats)) {
      (seats || []).forEach((seat, pIdx) => {
        if (seat && seat.id) {
          seat_preferences.push({
            segment_key:     segmentKey,
            passenger_index: pIdx,
            seat_id_local:   seat.id,
          });
        }
      });
    }
  }

  const payload = {
    // For round-trip, `flight` and `inboundFlight` come from the SAME Duffel
    // offer; we only send its id. The backend rejects any legacy attempt to
    // combine two one-way offer ids.
    offer_id: flight?.offerId || flight?.id,
    passengers: apiPassengers,
    contact_email: (contact?.email || '').trim(),
    seat_preferences,
  };
  const phone = (contact?.phone || '').trim();
  if (phone) payload.contact_phone = phone;
  return payload;
}

/** POST /api/bookings/draft — returns { booking_id, status, amount, currency, ... }. */
export async function createBookingDraft(payload) {
  const res = await fetch(`${API_BASE}/api/bookings/draft`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readError(res, 'Could not start checkout. Please try again.'));
  }
  return res.json();
}

/** GET /api/bookings/:id — server-authoritative booking summary. */
export async function fetchBooking(bookingId) {
  const res = await fetch(`${API_BASE}/api/bookings/${encodeURIComponent(bookingId)}`, {
    headers: await authHeaders(),
  });
  if (res.status === 404) throw new Error('This booking could not be found.');
  if (!res.ok) throw new Error(await readError(res, 'Could not load booking.'));
  return res.json();
}

/** GET /api/bookings — newest-first list of the signed-in user's bookings. */
export async function listBookings() {
  const res = await fetch(`${API_BASE}/api/bookings`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await readError(res, 'Could not load your trips.'));
  return res.json();
}

/**
 * GET /api/bookings/:id/details — owner-only trip view for My Trips:
 * itinerary, traveller names, and payment history (no Stripe ids or secrets).
 */
export async function fetchBookingDetails(bookingId) {
  const res = await fetch(`${API_BASE}/api/bookings/${encodeURIComponent(bookingId)}/details`, {
    headers: await authHeaders(),
  });
  if (res.status === 404) throw new Error('This trip could not be found.');
  if (!res.ok) throw new Error(await readError(res, 'Could not load trip details.'));
  return res.json();
}
