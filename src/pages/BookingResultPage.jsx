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

export default function BookingResultPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stripeRedirectStatus = searchParams.get('redirect_status');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
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

  const display = booking ? displayFor(booking) : null;
  const processing = booking ? isProcessingStatus(booking) : true;
  const isConfirmed = booking?.status === STATUS.CONFIRMED;
  const isPaymentFailed = booking?.status === STATUS.PAYMENT_FAILED;

  // Stripe redirect_status="failed" comes back on card decline BEFORE the
  // webhook has updated Firestore. We keep polling — the webhook will
  // arrive shortly and flip status to payment_failed.
  const showStripeFailureHint =
    stripeRedirectStatus === 'failed' && !isPaymentFailed && processing;

  return (
    <div className="dark">
      <Navbar />
      <main className="max-w-7xl mx-auto px-container-margin py-8">
        <div className="max-w-2xl mx-auto">
          <section className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-8 flex flex-col items-center text-center">
            {loading && !booking && (
              <>
                <div className="animate-spin mb-6">
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
                  <div className="animate-spin mb-6">
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

                {/* Status pill (matches history-card colour tokens) */}
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

                {/* Booking reference — ONLY after Duffel confirmation */}
                {isConfirmed && booking.duffel_booking_reference && (
                  <div className="mt-6 pt-6 border-t border-[#2C2C2C] w-full max-w-md">
                    <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-1">
                      Airline Booking Reference
                    </p>
                    <p className="font-headline-md text-headline-md text-primary tracking-wider">
                      {booking.duffel_booking_reference}
                    </p>
                  </div>
                )}

                {/* Price line (server-authoritative) */}
                {booking.amount && booking.currency && (
                  <p className="mt-6 font-label-sm text-label-sm text-outline">
                    Reference: <span className="text-primary">{booking.booking_id}</span>
                    {' · '}
                    {formatPrice(booking.amount, booking.currency)}
                  </p>
                )}

                {showStripeFailureHint && (
                  <p className="mt-4 font-label-sm text-label-sm text-outline">
                    Your bank reported the charge as declined. We&apos;re confirming with Stripe.
                  </p>
                )}

                {/* Actions */}
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
                    to="/dashboard"
                    className="px-6 py-3 rounded-full border border-[#2C2C2C] text-primary font-label-md text-label-md hover:border-[#4A4A4A] transition-colors"
                  >
                    Back to dashboard
                  </Link>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
