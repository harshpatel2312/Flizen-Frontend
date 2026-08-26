// src/services/paymentService.js
// ---------------------------------------------------------------------------
// Payment API — creates or retrieves a Stripe PaymentIntent through the
// backend. The publishable key is loaded via @stripe/stripe-js on demand.
// ---------------------------------------------------------------------------

import { loadStripe } from '@stripe/stripe-js';
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

// Cached across route mounts so refresh doesn't re-download Stripe.js.
let _stripePromise = null;
export function getStripePromise() {
  if (_stripePromise) return _stripePromise;
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    _stripePromise = Promise.resolve(null);
    return _stripePromise;
  }
  _stripePromise = loadStripe(key);
  return _stripePromise;
}

/** POST /api/payments/intents — returns { client_secret, display_amount, currency, ... }. */
export async function createOrReusePaymentIntent(bookingId) {
  const res = await fetch(`${API_BASE}/api/payments/intents`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ booking_id: bookingId }),
  });
  if (!res.ok) {
    let detail = 'Could not initialise payment.';
    try {
      const j = await res.json();
      if (j?.detail) detail = j.detail;
    } catch { /* ignore */ }
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
