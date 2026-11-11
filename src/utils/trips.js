// src/utils/trips.js
// ---------------------------------------------------------------------------
// My Trips helpers: grouping bookings into tabs, trip-level status labels,
// and local date/time formatting.
//
// Flight dates ("YYYY-MM-DD") and Duffel times ("2026-12-10T08:00:00") are
// airport-local; they are parsed without timezone conversion so a flight on
// Dec 10 never shows as Dec 9 in a western timezone.
// ---------------------------------------------------------------------------

import { STATUS, displayFor } from './bookingStatus';

export const TRIP_TABS = [
  { id: 'all',       label: 'All' },
  { id: 'upcoming',  label: 'Upcoming' },
  { id: 'pending',   label: 'Pending' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'refunded',  label: 'Refunded' },
];

/** "2026-12-10" or "2026-12-10T08:00:00" -> local Date at that calendar day/time. */
export function parseLocalDate(value) {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(value));
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
}

function startOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** First and last travel dates from the summary (itinerary dates match). */
export function tripDates(booking) {
  const fs = booking?.flight_summary || {};
  const depart = parseLocalDate(fs.departure_date);
  const ret = fs.is_round_trip ? parseLocalDate(fs.return_departure_date) : null;
  return { depart, ret, last: ret || depart };
}

export function isOfferExpired(booking, now = new Date()) {
  if (!booking?.offer_expires_at) return false;
  const t = new Date(booking.offer_expires_at);
  return !isNaN(t.getTime()) && t <= now;
}

/**
 * Tab a booking belongs to, or null when it should not be listed
 * (an unpaid checkout whose offer expired was never a purchase).
 */
export function tripCategory(booking, now = new Date()) {
  const s = booking?.status;
  if (s === STATUS.CONFIRMED) {
    const { last } = tripDates(booking);
    return last && last < startOfToday(now) ? 'completed' : 'upcoming';
  }
  if (s === STATUS.DRAFT) return isOfferExpired(booking, now) ? null : 'pending';
  if (s === STATUS.PAYMENT_FAILED) return isOfferExpired(booking, now) ? 'cancelled' : 'pending';
  if (s === STATUS.PAYMENT_RECEIVED || s === STATUS.FULFILLING) return 'pending';
  if (s === STATUS.FAILED_REFUNDING) {
    // Refund running -> Refunded tab; refund could not be started -> needs attention.
    return booking.refund_state === 'initiated' || !booking.refund_state ? 'refunded' : 'pending';
  }
  if (s === STATUS.REFUNDED) return 'refunded';
  if (s === STATUS.CANCELED) return 'cancelled';
  return 'pending';
}

/** Status pill for a trip: completed trips read differently from bookings. */
export function tripStatus(booking, now = new Date()) {
  const category = tripCategory(booking, now);
  if (category === 'completed') return { label: 'Completed', tone: 'gray' };
  if (category === 'upcoming')  return { label: 'Upcoming', tone: 'green' };
  if (booking?.status === STATUS.PAYMENT_FAILED && category === 'cancelled') {
    return { label: 'Payment failed', tone: 'red' };
  }
  const d = displayFor(booking);
  return { label: d.label, tone: d.tone };
}

/** Bookings in the given categories, sorted for reading. */
export function tripsInCategories(bookings, categories, now = new Date()) {
  const departTime = (b) => tripDates(b).depart?.getTime() ?? 0;
  const createdTime = (b) => new Date(b.created_at || 0).getTime() || 0;
  const list = bookings.filter((b) => categories.includes(tripCategory(b, now)));

  if (categories.length === 1 && categories[0] === 'upcoming') {
    return list.sort((a, b) => departTime(a) - departTime(b)); // soonest first
  }
  if (categories.length === 1 && categories[0] === 'completed') {
    return list.sort((a, b) => departTime(b) - departTime(a)); // most recent trip first
  }
  return list.sort((a, b) => createdTime(b) - createdTime(a)); // newest booking first
}

export function tabCounts(bookings, now = new Date()) {
  const counts = Object.fromEntries(TRIP_TABS.map((t) => [t.id, 0]));
  for (const b of bookings) {
    const c = tripCategory(b, now);
    if (!c) continue;
    counts[c] += 1;
    counts.all += 1;
  }
  return counts;
}

/** Sections shown on the "All" tab, in reading order. */
export const ALL_SECTIONS = [
  { id: 'pending',  title: 'In progress',   categories: ['pending'] },
  { id: 'upcoming', title: 'Upcoming',      categories: ['upcoming'] },
  { id: 'past',     title: 'Past & closed', categories: ['completed', 'cancelled', 'refunded'] },
];

/** Copy for an empty tab. */
export const EMPTY_TAB = {
  upcoming:  { icon: 'flight_takeoff',    title: 'No upcoming trips',   text: 'Confirmed bookings for future flights will appear here.' },
  pending:   { icon: 'hourglass_empty',   title: 'Nothing in progress', text: 'Bookings awaiting payment or airline confirmation will appear here.' },
  completed: { icon: 'flight_land',       title: 'No completed trips',  text: 'Trips move here after your last flight date.' },
  cancelled: { icon: 'event_busy',        title: 'No cancelled trips',  text: 'Cancelled bookings and declined payments will appear here.' },
  refunded:  { icon: 'currency_exchange', title: 'No refunds',          text: 'Refunded bookings will appear here.' },
};

// ── Formatting ───────────────────────────────────────────────────────────

/** "Tue, Dec 10, 2026" (or without year when `withYear` is false). */
export function formatTripDate(value, { withYear = true, weekday = true } = {}) {
  const d = value instanceof Date ? value : parseLocalDate(value);
  if (!d) return null;
  return d.toLocaleDateString(undefined, {
    ...(weekday ? { weekday: 'short' } : {}),
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

/** "08:00" from an airport-local Duffel timestamp. */
export function formatLocalTime(value) {
  const m = /T(\d{2}):(\d{2})/.exec(String(value || ''));
  return m ? `${m[1]}:${m[2]}` : '—';
}

/** "+1" when arrival is on a later calendar day than departure. */
export function dayOffset(departingAt, arrivingAt) {
  const a = parseLocalDate(departingAt);
  const b = parseLocalDate(arrivingAt);
  if (!a || !b) return 0;
  const diff = Math.round(
    (new Date(b.getFullYear(), b.getMonth(), b.getDate()) - new Date(a.getFullYear(), a.getMonth(), a.getDate()))
      / 86400000,
  );
  return diff > 0 ? diff : 0;
}

/** Server timestamps (UTC ISO) in the user's timezone: "Nov 11, 2026, 1:51 PM". */
export function formatTimestamp(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/** First 8 chars of the internal booking UUID (copy buttons copy the full id). */
export function shortBookingId(id) {
  if (!id) return '';
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

const TRAVELLER_TYPE = { adult: 'Adult', child: 'Child', infant: 'Infant' };
export const travellerTypeLabel = (t) => TRAVELLER_TYPE[t] || 'Adult';

const PAYMENT_STATUS = {
  requires_payment_method: { label: 'Awaiting payment', tone: 'gray' },
  requires_confirmation:   { label: 'Awaiting payment', tone: 'gray' },
  requires_action:         { label: 'Authentication needed', tone: 'gray' },
  processing:              { label: 'Processing', tone: 'gray' },
  payment_failed:          { label: 'Declined', tone: 'red' },
  succeeded:               { label: 'Paid', tone: 'green' },
  canceled:                { label: 'Cancelled', tone: 'gray' },
  partially_refunded:      { label: 'Partially refunded', tone: 'blue' },
  refunded:                { label: 'Refunded', tone: 'blue' },
};
export const paymentStatusDisplay = (s) => PAYMENT_STATUS[s] || { label: s || 'Unknown', tone: 'gray' };

/** Human wording for a Stripe decline code ("insufficient_funds" -> "Insufficient funds"). */
export function humanizeCode(code) {
  if (!code) return null;
  const s = String(code).replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
