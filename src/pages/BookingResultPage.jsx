// src/pages/BookingResultPage.jsx
// ---------------------------------------------------------------------------
// Booking-result / processing page.
//
// Reached in two ways:
//   1. Stripe return_url: /payment/:bookingId/processing
//   2. Direct navigation from FlightHistory: /booking/:bookingId
//
// Polls GET /api/bookings/:id while the booking is in a processing state.
// Never surfaces a booking reference until Duffel has confirmed the order.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CopyButton from '../components/CopyButton';
import Sep from '../components/Sep';
import { getAirport } from '../services/apiService';
import { fetchBooking } from '../services/bookingService';
import { formatPrice } from '../utils/flightUtils';
import {
  STATUS,
  displayFor,
  isProcessingStatus,
  pillClassFor,
} from '../utils/bookingStatus';

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 60; // ~2.5 minutes

// Static class names so Tailwind can detect them.
const SUMMARY_COLS = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' };

// Show only the first few characters of the internal booking UUID; the copy
// button still copies the full value.
function shortId(id) {
  if (!id) return '';
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

export default function BookingResultPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stripeRedirectStatus = searchParams.get('redirect_status');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copied, setCopied] = useState(null); // 'airline' | 'booking' | null
  const attemptsRef = useRef(0);
  const timerRef = useRef(null);

  // Load once + poll while processing.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const bk = await fetchBooking(bookingId);
        if (cancelled) return;
        setBooking(bk);
        setErrorMsg(null);
        // Continue polling only while the server hasn't reached a stable state.
        if (isProcessingStatus(bk) && attemptsRef.current < MAX_POLL_ATTEMPTS) {
          attemptsRef.current += 1;
          timerRef.current = setTimeout(load, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err.message || 'Could not load booking.');
          // Keep polling — the doc may exist by the next tick.
          if (attemptsRef.current < MAX_POLL_ATTEMPTS) {
            attemptsRef.current += 1;
            timerRef.current = setTimeout(load, POLL_INTERVAL_MS);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bookingId]);

  const copyToClipboard = async (value, key) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard API unavailable or denied — fail silently.
    }
  };

  const display = booking ? displayFor(booking) : null;
  const processing = booking ? isProcessingStatus(booking) : true;
  const isConfirmed = booking?.status === STATUS.CONFIRMED;
  const showAirlineRef = Boolean(isConfirmed && booking?.duffel_booking_reference);
  const summaryCellCount =
    1 + (showAirlineRef ? 1 : 0) + (booking?.amount && booking?.currency ? 1 : 0);
  const isPaymentFailed = booking?.status === STATUS.PAYMENT_FAILED;

  // Stripe redirect_status="failed" comes back on card decline BEFORE the
  // webhook has updated Firestore. We keep polling — the webhook will
  // arrive shortly and flip status to payment_failed.
  const showStripeFailureHint =
    stripeRedirectStatus === 'failed' && !isPaymentFailed && processing;

  // ── Progress tracker: three stages mapped from booking.status ──────────
  // 0 = pending, 1 = active (pulsing), 2 = complete
  const stageState = (() => {
    const s = booking?.status;
    if (s === STATUS.CONFIRMED)        return [2, 2, 2];
    if (s === STATUS.FULFILLING)       return [2, 1, 0];
    if (s === STATUS.PAYMENT_RECEIVED) return [2, 1, 0];
    if (s === STATUS.DRAFT)            return [1, 0, 0];
    // Terminal failure / refund states → leave as pending so the UI
    // doesn't look like progress is still happening.
    return [0, 0, 0];
  })();

  const fs = booking?.flight_summary;

  // Resolve city names once per set of codes (not on every poll tick).
  const [cityMap, setCityMap] = useState({});
  const airportCodesKey = [
    fs?.from_airport, fs?.to_airport, fs?.return_from_airport, fs?.return_to_airport,
  ].filter(Boolean).join(',');
  useEffect(() => {
    if (!airportCodesKey) return;
    let cancelled = false;
    const codes = [...new Set(airportCodesKey.split(','))];
    Promise.all(codes.map((c) => getAirport(c).catch(() => null)))
      .then((results) => {
        if (cancelled) return;
        const map = {};
        codes.forEach((code, i) => { if (results[i]?.city) map[code] = results[i].city; });
        setCityMap(map);
      });
    return () => { cancelled = true; };
  }, [airportCodesKey]);
  const fmtAirport = (code) => {
    if (!code) return '—';
    const city = cityMap[code];
    return city ? `${city} (${code})` : code;
  };

  return (
    <div className="dark">
      <Navbar />
      <main className="max-w-7xl mx-auto px-container-margin py-8">
        <div className="max-w-2xl mx-auto">
          <section className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-8 flex flex-col items-center text-center">
            {loading && !booking && (
              <>
                <div className="animate-pulse mb-6">
                  <span className="material-symbols-outlined text-5xl text-primary">
                    flight_takeoff
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
                  Loading your booking
                </h1>
              </>
            )}

            {!loading && !booking && errorMsg && (
              <>
                <span className="material-symbols-outlined text-5xl text-error mb-6">
                  error
                </span>
                <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
                  Could not load booking
                </h1>
                <p className="font-body-lg text-body-lg text-outline max-w-md">
                  {errorMsg}
                </p>
              </>
            )}

            {booking && display && (
              <>
                {/* Status icon */}
                {processing ? (
                  <div className="animate-pulse mb-6">
                    <span className="material-symbols-outlined text-5xl text-primary">
                      flight_takeoff
                    </span>
                  </div>
                ) : isConfirmed ? (
                  <span className="material-symbols-outlined text-5xl text-green-400 mb-6">
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-5xl text-error mb-6">
                    error
                  </span>
                )}

                {/* Status pill */}
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-medium mb-4 ${pillClassFor(display.tone)}`}
                >
                  {display.label}
                </span>

                <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
                  {display.headline}
                </h1>
                <p className="font-body-lg text-body-lg text-outline max-w-md">
                  {display.description}
                </p>

                {/* ── Trip summary (what the user is waiting on) ── */}
                {fs && (fs.from_airport || fs.to_airport) && (
                  <div className="mt-8 w-full">
                    <SectionHeader label="Your trip" />
                    <div className="mt-3 bg-[#1A1A1A] border border-[#2C2C2C] rounded-xl p-4 text-left space-y-4">
                      <TripLeg
                        label={fs.is_round_trip ? 'Departure' : 'Flight'}
                        from={fmtAirport(fs.from_airport)}
                        to={fmtAirport(fs.to_airport)}
                        airline={fs.airline}
                        date={fs.departure_date}
                      />
                      {fs.is_round_trip && (fs.return_from_airport || fs.return_to_airport) && (
                        <>
                          <div className="border-t border-[#2C2C2C]" />
                          <TripLeg
                            label="Return"
                            from={fmtAirport(fs.return_from_airport)}
                            to={fmtAirport(fs.return_to_airport)}
                            airline={fs.airline}
                            date={fs.return_departure_date}
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Progress tracker — only during processing ── */}
                {processing && (
                  <div className="mt-8 w-full">
                    <SectionHeader label="Progress" />
                    <ol className="mt-3 bg-[#1A1A1A] border border-[#2C2C2C] rounded-xl p-5 text-left space-y-4">
                      <ProgressStep
                        state={stageState[0]}
                        icon="credit_card"
                        title="Payment received"
                        subtitle="Securely captured by Stripe"
                      />
                      <ProgressStep
                        state={stageState[1]}
                        icon="flight_takeoff"
                        title="Confirming with airline"
                        subtitle="Reserving your seats on this flight"
                      />
                      <ProgressStep
                        state={stageState[2]}
                        icon="confirmation_number"
                        title="Ticket issued"
                        subtitle="Airline reference ready"
                      />
                    </ol>
                    <p className="mt-3 font-label-sm text-label-sm text-outline">
                      Takes under a minute. We&apos;ll email you when it&apos;s confirmed.
                    </p>
                  </div>
                )}

                {/* Booking summary — airline reference (ONLY after Duffel confirmation), booking ID, amount */}
                {((booking.amount && booking.currency) || showAirlineRef) && (
                  <div className="mt-6 w-full bg-[#1A1A1A] border border-[#2C2C2C] rounded-xl overflow-hidden text-left">
                    <div
                      className={`grid grid-cols-1 ${SUMMARY_COLS[summaryCellCount]} divide-y sm:divide-y-0 sm:divide-x divide-[#2C2C2C]`}
                    >
                      {showAirlineRef && (
                        <SummaryCell label="Airline Reference">
                          <span className="font-headline-md text-headline-md text-primary tracking-[0.15em]">
                            {booking.duffel_booking_reference}
                          </span>
                          <CopyButton
                            copied={copied === 'airline'}
                            label="airline reference"
                            onClick={() => copyToClipboard(booking.duffel_booking_reference, 'airline')}
                          />
                        </SummaryCell>
                      )}
                      <SummaryCell label="Booking ID">
                        <span
                          className="font-body-lg text-body-lg font-semibold text-primary tabular-nums"
                          title={booking.booking_id}
                        >
                          {shortId(booking.booking_id)}
                        </span>
                        <CopyButton
                          copied={copied === 'booking'}
                          label="booking ID"
                          onClick={() => copyToClipboard(booking.booking_id, 'booking')}
                        />
                      </SummaryCell>
                      {booking.amount && booking.currency && (
                        <SummaryCell label="Amount">
                          <span className="font-headline-md text-headline-md text-primary">
                            {formatPrice(booking.amount, booking.currency)}
                          </span>
                        </SummaryCell>
                      )}
                    </div>

                    {showAirlineRef && (
                      <div className="px-5 py-3 border-t border-[#2C2C2C] bg-[#161616] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] leading-none text-outline" aria-hidden="true">
                          info
                        </span>
                        <p className="font-label-sm text-label-sm text-outline">
                          Use your airline reference to check in or manage your trip on the airline&apos;s website.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {showStripeFailureHint && (
                  <p className="mt-4 font-label-sm text-label-sm text-outline">
                    Your bank reported the charge as declined. We&apos;re confirming with Stripe.
                  </p>
                )}

                {/* Actions — hidden while securing the booking; the page updates itself. */}
                {!(processing && booking.status !== STATUS.FAILED_REFUNDING) && (
                  <div className="mt-8 flex gap-3">
                    {isPaymentFailed && (
                      <button
                        onClick={() =>
                          navigate(`/payment/${encodeURIComponent(bookingId)}`)
                        }
                        className="px-6 py-3 rounded-full font-label-md text-label-md font-bold bg-primary text-on-primary hover:opacity-90 transition-opacity"
                      >
                        Try again
                      </button>
                    )}
                    <Link
                      to={isConfirmed ? `/trips/${encodeURIComponent(bookingId)}` : '/dashboard'}
                      className="px-6 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold hover:opacity-90 transition-opacity"
                    >
                      {isConfirmed ? 'View My Trips' : 'Back to dashboard'}
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// ─── Small presentational helpers ─────────────────────────────────────────

function SummaryCell({ label, children }) {
  return (
    <div className="p-5 min-w-0">
      <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-2">
        {label}
      </p>
      <div className="flex items-center gap-2 h-8 min-w-0">{children}</div>
    </div>
  );
}

function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-[#2C2C2C]" />
      <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">
        {label}
      </span>
      <div className="flex-1 h-px bg-[#2C2C2C]" />
    </div>
  );
}

function TripLeg({ label, from, to, airline, date }) {
  const formatDate = (iso) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric',
      });
    } catch {
      return iso;
    }
  };
  return (
    <div>
      <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-1">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
        <span className="font-headline-sm text-headline-sm text-primary">{from || '—'}</span>
        <span className="material-symbols-outlined text-outline text-base">arrow_right_alt</span>
        <span className="font-headline-sm text-headline-sm text-primary">{to || '—'}</span>
      </div>
      <p className="font-label-sm text-label-sm text-outline">
        {airline || 'Airline TBD'}
        {date && (<><Sep />{formatDate(date)}</>)}
      </p>
    </div>
  );
}

function ProgressStep({ state, icon, title, subtitle }) {
  // state: 0 = pending, 1 = active, 2 = complete
  const isComplete = state === 2;
  const isActive = state === 1;
  const bgClass =
    isComplete ? 'bg-green-500/20 text-green-400' :
    isActive   ? 'bg-primary/15 text-primary animate-pulse' :
                 'bg-[#2C2C2C] text-outline';
  const titleClass =
    isComplete ? 'text-primary' :
    isActive   ? 'text-primary' :
                 'text-outline';
  return (
    <li className="flex items-start gap-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${bgClass}`}>
        <span className="material-symbols-outlined text-[18px] leading-none">
          {isComplete ? 'check' : icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-label-md text-label-md ${titleClass}`}>{title}</p>
        <p className="font-label-sm text-label-sm text-outline">{subtitle}</p>
      </div>
    </li>
  );
}
