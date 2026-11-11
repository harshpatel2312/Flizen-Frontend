// src/components/trips/TripDetailsPanel.jsx
// Side panel (desktop) / full view (mobile) for one trip on My Trips.
// Loads GET /api/bookings/:id/details and refreshes itself while the booking
// is still being confirmed or refunded, reporting changes to the page.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import CopyButton from '../CopyButton';
import Sep from '../Sep';
import { fetchBookingDetails } from '../../services/bookingService';
import { STATUS, displayFor, pillClassFor } from '../../utils/bookingStatus';
import { formatDuration, formatPrice, getStopsLabel } from '../../utils/flightUtils';
import {
  dayOffset,
  formatLocalTime,
  formatTimestamp,
  formatTripDate,
  humanizeCode,
  isOfferExpired,
  parseLocalDate,
  paymentStatusDisplay,
  shortBookingId,
  travellerTypeLabel,
  tripCategory,
  tripStatus,
} from '../../utils/trips';

const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = 24; // ~2 minutes

const PANEL =
  'bg-[#1F1F1F] border border-[#2C2C2C] rounded-xl p-6 shadow-[0_0_32px_rgba(0,0,0,0.4)] lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto flight-details-scroll';
const PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold hover:opacity-90 transition-opacity';
const SECONDARY_BTN =
  'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-[#2C2C2C] text-primary font-label-md text-label-md font-bold hover:border-[#4A4A4A] transition-colors';

/** Bookings whose status will still change without user action. */
function isSettling(b) {
  if (!b) return false;
  if (b.status === STATUS.PAYMENT_RECEIVED || b.status === STATUS.FULFILLING) return true;
  return b.status === STATUS.FAILED_REFUNDING && (b.refund_state === 'initiated' || !b.refund_state);
}

export default function TripDetailsPanel({ bookingId, cityMap, onBack, onUpdate }) {
  // Keyed by booking id so switching trips never shows the previous trip's data.
  const [state, setState] = useState({ id: null, details: null, error: null });
  const [reloadKey, setReloadKey] = useState(0);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const current = state.id === bookingId ? state : { id: bookingId, details: null, error: null };
  const { details, error } = current;
  const loading = Boolean(bookingId) && !details && !error;

  useEffect(() => {
    if (!bookingId) return undefined;
    let cancelled = false;
    let timer = null;
    let polls = 0;

    async function load() {
      try {
        const d = await fetchBookingDetails(bookingId);
        if (cancelled) return;
        setState({ id: bookingId, details: d, error: null });
        onUpdateRef.current?.(d);
        if (isSettling(d) && polls < MAX_POLLS) {
          polls += 1;
          timer = setTimeout(load, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        const message = err.message || 'Could not load trip details.';
        // Keep showing loaded details if a background refresh fails.
        setState((s) => (s.id === bookingId && s.details ? s : { id: bookingId, details: null, error: message }));
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [bookingId, reloadKey]);

  const retry = () => {
    setState({ id: bookingId, details: null, error: null });
    setReloadKey((k) => k + 1);
  };

  if (!bookingId) {
    return (
      <div className="lg:sticky lg:top-24">
        <div className={PANEL}>
          <h2 className="font-headline-md text-headline-md text-primary mb-6">Trip Details</h2>
          <div className="flex flex-col items-center text-center gap-3 py-8">
            <span className="material-symbols-outlined text-5xl text-[#2C2C2C]">airplane_ticket</span>
            <p className="text-on-surface-variant">Select a trip to see its itinerary, travellers, and payments</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:sticky lg:top-24">
      <div className={PANEL}>
        <button
          type="button"
          onClick={onBack}
          className="lg:hidden inline-flex items-center gap-2 text-outline hover:text-primary transition-colors mb-4 font-label-md text-label-md"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          All trips
        </button>

        {loading && !details && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="animate-pulse">
              <span className="material-symbols-outlined text-5xl text-primary">flight_takeoff</span>
            </div>
            <p className="text-on-surface-variant font-label-sm">Loading trip details…</p>
          </div>
        )}

        {error && !details && (
          <div className="flex flex-col items-center text-center gap-4 py-10">
            <span className="material-symbols-outlined text-5xl text-error">error</span>
            <div>
              <p className="text-primary font-label-lg text-label-lg">Couldn&apos;t load this trip</p>
              <p className="text-on-surface-variant text-sm mt-1">{error}</p>
            </div>
            <button type="button" onClick={retry} className={SECONDARY_BTN}>
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Try again
            </button>
          </div>
        )}

        {details && <TripDetailsContent details={details} cityMap={cityMap} />}
      </div>
    </div>
  );
}

// ─── Content ─────────────────────────────────────────────────────────────

function TripDetailsContent({ details, cityMap }) {
  const fs = details.flight_summary || {};
  const itinerary = details.itinerary;
  const status = tripStatus(details);
  const display = displayFor(details);
  const category = tripCategory(details);
  const isConfirmed = details.status === STATUS.CONFIRMED;
  const isRoundTrip = Boolean(fs.is_round_trip || (itinerary?.slices?.length || 0) > 1);

  const cityFor = (code, fallback) => fallback || cityMap?.[code] || code || '—';
  const firstSlice = itinerary?.slices?.[0];
  const fromCity = cityFor(fs.from_airport, firstSlice?.origin_city);
  const toCity = cityFor(fs.to_airport, firstSlice?.destination_city);

  const departDate = formatTripDate(fs.departure_date, { weekday: false, withYear: !isRoundTrip });
  const returnDate = isRoundTrip ? formatTripDate(fs.return_departure_date, { weekday: false }) : null;
  const travellerCount = details.travellers?.length || details.passenger_count || 0;

  // Confirmed trips speak for themselves; other states get the explanation.
  const notice = category === 'upcoming' || category === 'completed' ? null : display.description;

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="font-headline-md text-headline-md text-primary">Trip Details</h2>
        <span className={`shrink-0 px-3 py-0.5 rounded-full text-xs font-medium ${pillClassFor(status.tone)}`}>
          {status.label}
        </span>
      </div>
      <p className="font-body-md text-body-md text-primary flex items-center gap-2 flex-wrap mt-3">
        <span>{fromCity}</span>
        <span className="material-symbols-outlined text-outline text-base" aria-hidden="true">
          {isRoundTrip ? 'sync_alt' : 'arrow_right_alt'}
        </span>
        <span>{toCity}</span>
      </p>
      <p className="font-label-sm text-label-sm text-outline mt-1">
        {isRoundTrip ? 'Round trip' : 'One way'}
        {departDate && (<><Sep />{departDate}{returnDate && ` – ${returnDate}`}</>)}
        <Sep />{travellerCount} traveller{travellerCount === 1 ? '' : 's'}
      </p>

      {notice && (
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-[#2C2C2C] bg-[#161616] px-3 py-2.5">
          <span className="material-symbols-outlined text-[16px] leading-5 text-outline" aria-hidden="true">info</span>
          <p className="font-label-sm text-label-sm text-on-surface-variant">{notice}</p>
        </div>
      )}

      {/* References */}
      <div className="mt-5 rounded-lg overflow-hidden border border-[#2C2C2C] divide-y divide-[#2C2C2C]">
        {isConfirmed && details.duffel_booking_reference && (
          <ReferenceCell label="Airline Reference" display={details.duffel_booking_reference} value={details.duffel_booking_reference} large />
        )}
        <ReferenceCell label="Booking ID" display={shortBookingId(details.booking_id)} value={details.booking_id} />
      </div>
      {isConfirmed && details.duffel_booking_reference && (
        <p className="mt-2 font-label-sm text-label-sm text-outline">
          Use your airline reference to check in or manage your trip on the airline&apos;s website.
        </p>
      )}

      {/* Itinerary */}
      <Section title="Itinerary">
        {itinerary?.slices?.length ? (
          <div className="space-y-5">
            {itinerary.slices.map((slice, i) => (
              <SliceBlock
                key={i}
                slice={slice}
                label={itinerary.slices.length > 1 ? (i === 0 ? 'Outbound' : 'Return') : 'Flight'}
                cityMap={cityMap}
              />
            ))}
          </div>
        ) : (
          <SummaryItinerary fs={fs} cityMap={cityMap} />
        )}
      </Section>

      {/* Travellers */}
      {details.travellers?.length > 0 && (
        <Section title="Travellers">
          <ul className="space-y-2">
            {details.travellers.map((t, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-label-md text-label-md text-primary min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">person</span>
                  <span className="truncate">{`${t.given_name} ${t.family_name}`.trim() || `Traveller ${i + 1}`}</span>
                </span>
                <span className="font-label-sm text-label-sm text-outline">{travellerTypeLabel(t.type)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Payment */}
      <PaymentSection details={details} />

      {/* Timeline */}
      <TimelineSection details={details} />

      <TripActions details={details} />

      {details.contact_email && (
        <p className="mt-6 font-label-sm text-label-sm text-outline text-center">
          Booking updates are sent to {details.contact_email}
        </p>
      )}
    </>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-6 pt-6 border-t border-[#2C2C2C]">
      <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-3">{title}</p>
      {children}
    </section>
  );
}

function Row({ label, value, accent }) {
  const valueClass =
    accent === 'green' ? 'text-green-400' :
    accent === 'red'   ? 'text-red-400'   :
    accent === 'blue'  ? 'text-blue-400'  :
                         'text-primary';
  return (
    <div className="flex justify-between gap-4 font-label-md text-label-md">
      <span className="text-outline">{label}</span>
      <span className={`text-right ${valueClass}`}>{value}</span>
    </div>
  );
}

function ReferenceCell({ label, display, value, large = false }) {
  return (
    <div className="bg-[#1A1A1A] px-4 py-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-2">
        <span
          className={`text-primary tabular-nums whitespace-nowrap ${large ? 'font-headline-md text-headline-md tracking-[0.15em]' : 'font-body-md text-body-md font-semibold'}`}
          title={value}
        >
          {display}
        </span>
        <CopyButton value={value} label={label.toLowerCase()} />
      </div>
    </div>
  );
}

/** "Chicago (ORD)", or just "ORD" when the city is unknown. */
function placeLabel(code, city) {
  if (!city || city === code) return <>{code || '—'}</>;
  return <>{city}<span className="text-outline"> ({code})</span></>;
}

// ── Itinerary ────────────────────────────────────────────────────────────

function layoverLabel(prev, next) {
  const a = parseLocalDate(prev?.arriving_at);
  const b = parseLocalDate(next?.departing_at);
  if (!a || !b || b <= a) return null;
  const mins = Math.round((b - a) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

function SliceBlock({ slice, label, cityMap }) {
  const segments = slice.segments || [];
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <p className="font-label-md text-label-md text-primary">
          {label}
          <span className="text-outline font-normal">
            <Sep />{formatTripDate(slice.departing_at, { withYear: false }) || '—'}
          </span>
        </p>
        <p className="font-label-sm text-label-sm text-outline whitespace-nowrap">
          {formatDuration(slice.duration)}<Sep />{getStopsLabel(slice.stops ?? Math.max(segments.length - 1, 0))}
        </p>
      </div>

      <ol className="space-y-0">
        {segments.map((seg, i) => (
          <li key={i}>
            {i > 0 && layoverLabel(segments[i - 1], seg) && (
              <div className="ml-[3.25rem] my-2 inline-flex items-center gap-1.5 rounded-full bg-[#2C2C2C] px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] leading-none" aria-hidden="true">schedule</span>
                Layover {layoverLabel(segments[i - 1], seg)} in {seg.origin_city || cityMap?.[seg.origin] || seg.origin}
              </div>
            )}
            <SegmentRow seg={seg} cityMap={cityMap} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function SegmentRow({ seg, cityMap }) {
  const offset = dayOffset(seg.departing_at, seg.arriving_at);
  const meta = [
    seg.flight_number,
    seg.airline,
    seg.operating_airline && seg.operating_airline !== seg.airline ? `Operated by ${seg.operating_airline}` : null,
    seg.aircraft,
    seg.cabin,
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-[2.75rem_1rem_1fr] gap-x-2">
      {/* Departure */}
      <p className="font-label-md text-label-md text-primary tabular-nums pt-0.5">{formatLocalTime(seg.departing_at)}</p>
      <div className="flex flex-col items-center pt-1.5" aria-hidden="true">
        <div className="w-2 h-2 rounded-full border border-outline" />
        <div className="flex-1 w-px bg-[#3A3A3A] my-1" />
      </div>
      <p className="font-label-md text-label-md text-primary pb-2">
        {placeLabel(seg.origin, seg.origin_city || cityMap?.[seg.origin])}
      </p>

      {/* Flight info */}
      <span />
      <div className="flex justify-center" aria-hidden="true"><div className="w-px bg-[#3A3A3A]" /></div>
      <p className="font-label-sm text-label-sm text-outline pb-3">
        {meta.map((m, i) => (<span key={i}>{i > 0 && <Sep />}{m}</span>))}
        {seg.duration && (<><Sep />{formatDuration(seg.duration)}</>)}
      </p>

      {/* Arrival */}
      <p className="font-label-md text-label-md text-primary tabular-nums">
        {formatLocalTime(seg.arriving_at)}
        {offset > 0 && <sup className="text-outline ml-0.5">+{offset}</sup>}
      </p>
      <div className="flex flex-col items-center" aria-hidden="true">
        <div className="w-px h-1.5 bg-[#3A3A3A]" />
        <div className="w-2 h-2 rounded-full bg-outline" />
      </div>
      <p className="font-label-md text-label-md text-primary">
        {placeLabel(seg.destination, seg.destination_city || cityMap?.[seg.destination])}
      </p>
    </div>
  );
}

/** Older bookings created before itineraries were stored. */
function SummaryItinerary({ fs, cityMap }) {
  const city = (c) => (cityMap?.[c] ? `${cityMap[c]} (${c})` : c || '—');
  const legs = [
    { label: fs.is_round_trip ? 'Outbound' : 'Flight', from: fs.from_airport, to: fs.to_airport, date: fs.departure_date },
    ...(fs.is_round_trip
      ? [{ label: 'Return', from: fs.return_from_airport, to: fs.return_to_airport, date: fs.return_departure_date }]
      : []),
  ];
  return (
    <div className="space-y-4">
      {legs.map((leg) => (
        <div key={leg.label}>
          <p className="font-label-md text-label-md text-primary">
            {leg.label}
            <span className="text-outline font-normal"><Sep />{formatTripDate(leg.date, { withYear: false }) || '—'}</span>
          </p>
          <p className="font-label-md text-label-md text-on-surface-variant mt-1">
            {city(leg.from)} → {city(leg.to)}
          </p>
          {fs.airline && <p className="font-label-sm text-label-sm text-outline mt-0.5">{fs.airline}</p>}
        </div>
      ))}
    </div>
  );
}

// ── Payment ──────────────────────────────────────────────────────────────

function PaymentSection({ details }) {
  const payments = details.payments || [];
  const latest = payments[payments.length - 1];
  const paid = payments.find((p) => ['succeeded', 'partially_refunded', 'refunded'].includes(p.status));
  // Bookings refunded before payment records existed have no refund record.
  const legacyRefund = !payments.length && details.status === STATUS.REFUNDED
    ? { status: 'refunded', amount_refunded: details.amount, currency: details.currency, refunded_at: details.refunded_at }
    : null;
  const refunded = payments.find((p) => p.amount_refunded) || legacyRefund;
  const statusKey = refunded?.status || paid?.status || latest?.status || details.payment_status;
  const statusInfo = paymentStatusDisplay(statusKey);
  const isRoundTrip = Boolean(details.flight_summary?.is_round_trip || (details.slice_count || 0) > 1);

  return (
    <Section title="Payment">
      <div className="space-y-2">
        <div className="flex justify-between font-headline-md text-headline-md text-primary">
          <span>Total</span>
          <span>{formatPrice(details.amount, details.currency)}</span>
        </div>
        {isRoundTrip && <p className="font-label-sm text-label-sm text-outline -mt-1">Bundled round-trip fare</p>}
        {statusKey && (
          <Row label="Status" value={statusInfo.label} accent={statusInfo.tone === 'gray' ? undefined : statusInfo.tone} />
        )}
        {(paid?.succeeded_at || details.payment_received_at) && (
          <Row label="Paid on" value={formatTimestamp(paid?.succeeded_at || details.payment_received_at)} />
        )}
        {refunded && (
          <Row
            label={refunded.status === 'partially_refunded' ? 'Partially refunded' : 'Refunded'}
            value={formatPrice(refunded.amount_refunded, refunded.currency || details.currency)}
            accent="blue"
          />
        )}
        {refunded?.refunded_at && <Row label="Refunded on" value={formatTimestamp(refunded.refunded_at)} />}
        {!refunded && details.status === STATUS.FAILED_REFUNDING && details.refund_state === 'initiated' && (
          <Row label="Refund" value="In progress" accent="blue" />
        )}
        {(paid || refunded) && <Row label="Method" value="Original payment method" />}
      </div>

      {payments.length > 1 && (
        <div className="mt-4">
          <p className="font-label-sm text-label-sm text-outline mb-2">Payment attempts</p>
          <ul className="rounded-lg border border-[#2C2C2C] divide-y divide-[#2C2C2C]">
            {payments.map((p, i) => {
              const s = paymentStatusDisplay(p.status);
              return (
                <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-label-sm text-label-sm text-primary">
                      {formatTimestamp(p.created_at) || 'Attempt'}
                    </p>
                    {p.failure_code && (
                      <p className="font-label-sm text-label-sm text-outline">{humanizeCode(p.failure_code)}</p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${pillClassFor(s.tone)}`}>
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="mt-3 font-label-sm text-label-sm text-outline">
        Payments are processed securely by Stripe. Card details are never stored by Flizen.
      </p>
    </Section>
  );
}

// ── Timeline ─────────────────────────────────────────────────────────────

function TimelineSection({ details }) {
  const events = [
    { at: details.created_at, label: 'Booking started', icon: 'edit_note' },
    { at: details.payment_failed_at, label: 'Payment declined', icon: 'credit_card_off', tone: 'red' },
    { at: details.payment_received_at, label: 'Payment received', icon: 'credit_card' },
    { at: details.confirmed_at, label: 'Confirmed by the airline', icon: 'check_circle', tone: 'green' },
    { at: details.canceled_at, label: 'Cancelled', icon: 'cancel', tone: 'red' },
    { at: details.refund_initiated_at, label: 'Refund started', icon: 'currency_exchange', tone: 'blue' },
    { at: details.refunded_at, label: 'Refunded', icon: 'currency_exchange', tone: 'blue' },
  ]
    .filter((e) => e.at)
    .sort((a, b) => new Date(a.at) - new Date(b.at));

  if (events.length < 2) return null;

  const toneClass = {
    green: 'bg-green-500/20 text-green-400',
    red:   'bg-red-500/20 text-red-400',
    blue:  'bg-blue-500/20 text-blue-400',
  };

  return (
    <Section title="Activity">
      <ol className="space-y-3">
        {events.map((e, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${toneClass[e.tone] || 'bg-[#2C2C2C] text-outline'}`}>
              <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">{e.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="font-label-md text-label-md text-primary">{e.label}</p>
              <p className="font-label-sm text-label-sm text-outline">{formatTimestamp(e.at)}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ── Actions ──────────────────────────────────────────────────────────────

function TripActions({ details }) {
  const id = encodeURIComponent(details.booking_id);
  const payable =
    (details.status === STATUS.DRAFT || details.status === STATUS.PAYMENT_FAILED) && !isOfferExpired(details);

  let primary = null;
  if (payable) {
    primary = (
      <Link to={`/payment/${id}`} className={PRIMARY_BTN}>
        <span className="material-symbols-outlined text-[18px]">credit_card</span>
        {details.status === STATUS.PAYMENT_FAILED ? 'Try payment again' : 'Complete payment'}
      </Link>
    );
  } else if (isSettling(details)) {
    primary = (
      <Link to={`/booking/${id}`} className={SECONDARY_BTN}>
        <span className="material-symbols-outlined text-[18px]">monitoring</span>
        View live status
      </Link>
    );
  } else if (['cancelled', 'refunded'].includes(tripCategory(details)) || details.status === STATUS.PAYMENT_FAILED) {
    primary = (
      <Link to="/dashboard" className={SECONDARY_BTN}>
        <span className="material-symbols-outlined text-[18px]">search</span>
        Search flights again
      </Link>
    );
  }

  if (!primary) return null;
  return <div className="mt-6 flex justify-center">{primary}</div>;
}
