// src/pages/PaymentPage.jsx
// ---------------------------------------------------------------------------
// /payment/:bookingId — Stripe Payment Element.
// Refresh-safe: relies only on the URL booking ID; optional location.state
// is used only to enrich the trip-summary card.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

import Navbar from '../components/Navbar';
import Sep from '../components/Sep';
import { formatDuration, formatPrice, getStopsLabel } from '../utils/flightUtils';
import { fetchBooking } from '../services/bookingService';
import { createOrReusePaymentIntent, getStripePromise } from '../services/paymentService';

// ─── Stripe Appearance — matches the app's dark theme ─────────────────────
const STRIPE_APPEARANCE = {
  theme: 'night',
  variables: {
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSizeBase: '15px',
    colorPrimary:        '#FFFFFF',
    colorBackground:     '#1F1F1F',
    colorText:           '#FFFFFF',
    colorTextSecondary:  '#B0B0B0',
    colorTextPlaceholder:'#8e9192',
    colorDanger:         '#F87171',
    colorIcon:           '#8e9192',
    colorIconHover:      '#FFFFFF',
    borderRadius:        '9999px',
    spacingUnit:         '4px',
  },
  rules: {
    // ── Pill-shaped inputs (match app's rounded-full fields) ──
    '.Input': {
      backgroundColor: '#1F1F1F',
      border: '1px solid #2C2C2C',
      color: '#FFFFFF',
      padding: '14px 20px',
      borderRadius: '9999px',
      transition: 'border-color 150ms ease, box-shadow 150ms ease',
    },
    '.Input:hover':    { border: '1px solid #4A4A4A' },
    '.Input:focus':    { border: '1px solid #FFFFFF', boxShadow: '0 0 0 2px rgba(255,255,255,0.08)' },
    '.Input--invalid': { border: '1px solid #F87171', boxShadow: 'none' },

    // ── Floating field labels ──
    '.Label': {
      color: '#8e9192',
      fontSize: '11px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      fontWeight: '500',
    },

    // ── Payment-method tabs (Card / Link / ...) ──
    '.Tab': {
      backgroundColor: '#1F1F1F',
      border: '1px solid #2C2C2C',
      color: '#B0B0B0',
      borderRadius: '9999px',
      padding: '10px 16px',
      transition: 'background-color 150ms ease, color 150ms ease',
    },
    '.Tab:hover':         { backgroundColor: '#2C2C2C', color: '#FFFFFF' },
    '.Tab--selected':     { backgroundColor: '#FFFFFF', color: '#141313', border: '1px solid #FFFFFF' },
    '.TabLabel--selected':{ color: '#141313' },
    '.TabIcon--selected': { fill: '#141313' },

    // ── Dropdowns (country / state) — match airport autocomplete look ──
    '.Dropdown': {
      backgroundColor: '#1F1F1F',
      border: '1px solid #2C2C2C',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      padding: '4px',
    },
    '.DropdownItem': {
      color: '#FFFFFF',
      padding: '10px 14px',
      borderRadius: '8px',
      transition: 'background-color 120ms ease, color 120ms ease',
    },
    '.DropdownItem--highlight': {
      backgroundColor: '#2C2C2C',
      color: '#b1c5ff',
    },

    // ── "Optional — Save my information" + "Secure, fast checkout with Link" blocks ──
    '.Block': {
      backgroundColor: '#141313',
      border: '1px solid #2C2C2C',
      borderRadius: '16px',
      padding: '16px 18px',
      boxShadow: 'none',
    },
    '.BlockDivider': { backgroundColor: '#2C2C2C' },
    '.BlockAction':  { color: '#b1c5ff', fontWeight: '500' },
    '.BlockAction:hover': { color: '#FFFFFF' },

    // ── Checkboxes inside the Link / Save-info blocks ──
    '.CheckboxInput': {
      backgroundColor: '#1F1F1F',
      border: '1px solid #4A4A4A',
      borderRadius: '6px',
    },
    '.CheckboxInput--checked': {
      backgroundColor: '#FFFFFF',
      border: '1px solid #FFFFFF',
    },
    '.CheckboxLabel': {
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: '500',
    },

    // ── Picker items (e.g. saved payment methods) ──
    '.PickerItem': {
      backgroundColor: '#1F1F1F',
      border: '1px solid #2C2C2C',
      borderRadius: '12px',
      color: '#FFFFFF',
    },
    '.PickerItem:hover':      { backgroundColor: '#2C2C2C' },
    '.PickerItem--selected':  { backgroundColor: '#FFFFFF', color: '#141313', border: '1px solid #FFFFFF' },

    // ── Validation / help text ──
    '.Error':     { color: '#F87171', fontSize: '12px' },
    '.TermsText': { color: '#8e9192', fontSize: '12px' },
    '.TermsLink': { color: '#b1c5ff' },
    '.TermsLink:hover': { color: '#FFFFFF' },

    // ── Menu actions (edit / remove on saved cards) ──
    '.MenuAction':         { color: '#b1c5ff' },
    '.MenuAction:hover':   { color: '#FFFFFF' },

    // ── Link redirect / autofill helper text ──
    '.RedirectText': { color: '#B0B0B0' },
  },
};

// ─── Mini flight row (reused visual from other pages) ─────────────────────
function FlightMiniCard({ flight }) {
  if (!flight) return null;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {flight.airlineLogo ? (
          <img src={flight.airlineLogo} alt={flight.airline}
               className="w-8 h-8 rounded-full object-contain bg-[#1F1F1F] flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex-shrink-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm">flight</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-label-md text-label-md text-primary truncate">{flight.airline}</p>
          <p className="font-label-sm text-label-sm text-outline truncate">
            {flight.fromAirport} → {flight.toAirport}
          </p>
          <p className="font-label-sm text-label-sm text-outline">
            {flight.departureTime} – {flight.arrivalTime}
            {flight.duration && (<><Sep />{formatDuration(flight.duration)}</>)}
            <Sep />{getStopsLabel(flight.stops)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Summary panel (right column) ─────────────────────────────────────────
function PaymentSummaryPanel({ booking, flight, inboundFlight }) {
  const total = booking?.amount ?? '0.00';
  const currency = booking?.currency ?? 'USD';
  // Trust the server's slice_count on refresh — locationState may be gone.
  const isRoundTrip = !!inboundFlight || (booking?.slice_count ?? 1) > 1;
  const passengerCount = booking?.passenger_count ?? 1;
  const cabinClass = flight?.cabinClass || inboundFlight?.cabinClass || null;
  return (
    <div className="bg-[#1F1F1F] border border-[#2C2C2C] rounded-xl p-6 shadow-[0_0_32px_rgba(0,0,0,0.4)]">
      <div className="flex items-start justify-between gap-3 mb-6">
        <h2 className="font-headline-md text-headline-md text-primary">Order Summary</h2>
        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2C2C2C] text-primary font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[14px] leading-none">person</span>
          {passengerCount}
          {cabinClass && (<><Sep />{cabinClass}</>)}
        </span>
      </div>

      {flight ? (
        <>
          {isRoundTrip && (
            <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-3">
              Departure Flight
            </p>
          )}
          <FlightMiniCard flight={flight} />
          {isRoundTrip && inboundFlight && (
            <>
              <div className="my-5 border-t border-[#2C2C2C]" />
              <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-3">
                Return Flight
              </p>
              <FlightMiniCard flight={inboundFlight} />
            </>
          )}
        </>
      ) : (
        <p className="font-label-sm text-label-sm text-outline">
          {booking?.slice_count ?? 1} flight{(booking?.slice_count ?? 1) !== 1 ? 's' : ''}
        </p>
      )}

      <div className="mt-6 pt-5 border-t border-[#2C2C2C] space-y-1">
        <div className="flex justify-between font-headline-md text-headline-md text-primary">
          <span>Total</span>
          <span>{formatPrice(total, currency)}</span>
        </div>
        {isRoundTrip && (
          <p className="font-label-sm text-label-sm text-outline">
            Bundled round-trip fare
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Payment form (must be inside <Elements>) ─────────────────────────────
function PaymentForm({ bookingId, displayAmount, currency }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState(null);
  // 3D Secure sometimes redirects back with ?redirect_status=...; we don't
  // rely on it as confirmation of a completed booking — the backend does.
  const returnUrl = `${window.location.origin}/payment/${encodeURIComponent(bookingId)}/processing`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    // Only errors come back here; the success path is a full-page redirect.
    if (error) {
      const msg =
        error.type === 'validation_error'
          ? 'Please check your card details and try again.'
          : (error.message || 'Payment could not be completed.');
      setErrorMsg(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <PaymentElement options={{ layout: 'tabs' }} />

      {errorMsg && (
        <div className="p-4 bg-error/20 border border-error rounded-xl text-error">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            <span className="font-label-md text-label-md">{errorMsg}</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className={`self-center px-10 py-3 rounded-full font-label-md text-label-md font-bold transition-all duration-150 ${
          !stripe || submitting
            ? 'bg-[#252525] text-[#606060] cursor-not-allowed'
            : 'bg-primary text-on-primary hover:opacity-90 cursor-pointer'
        }`}
      >
        {submitting
          ? 'Processing…'
          : `Pay ${formatPrice(displayAmount, currency)}`}
      </button>

      <p className="text-[11px] text-outline text-center">
        Your booking is only confirmed after our servers verify payment with the airline.
      </p>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();

  // Optional context passed from earlier steps — enriches the summary only.
  const passedFlight        = locationState?.flight ?? null;
  const passedInboundFlight = locationState?.inboundFlight ?? null;

  const [booking,      setBooking]      = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [fatalError,   setFatalError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setFatalError(null);
        const [bk, intent] = await Promise.all([
          fetchBooking(bookingId),
          createOrReusePaymentIntent(bookingId),
        ]);
        if (cancelled) return;
        setBooking(bk);
        setClientSecret(intent.client_secret);
      } catch (err) {
        if (!cancelled) setFatalError(err.message || 'Could not load payment.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bookingId]);

  const stripePromise = useMemo(() => getStripePromise(), []);

  return (
    <div className="dark">
      <Navbar />

      <main className="max-w-7xl mx-auto px-container-margin py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-outline hover:text-primary transition-colors mb-6 font-label-md text-label-md"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
          {/* ── Left column (2/3) ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-primary">Payment</h1>
              <p className="font-body-lg text-body-lg text-outline mt-2">
                Enter your card details securely.
              </p>
            </div>

            <section className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-6 lg:p-8">
              {loading && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-pulse mb-4">
                      <span className="material-symbols-outlined text-4xl text-primary">credit_card</span>
                    </div>
                    <p className="text-on-surface-variant font-label-sm">Preparing secure payment…</p>
                  </div>
                </div>
              )}

              {!loading && fatalError && (
                <div className="p-4 bg-error/20 border border-error rounded-xl text-error">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    <span className="font-label-md text-label-md">{fatalError}</span>
                  </div>
                </div>
              )}

              {!loading && !fatalError && clientSecret && booking && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: STRIPE_APPEARANCE,
                    fonts: [
                      { cssSrc: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap' },
                    ],
                  }}
                >
                  <PaymentForm
                    bookingId={bookingId}
                    displayAmount={booking.amount}
                    currency={booking.currency}
                  />
                </Elements>
              )}
            </section>
          </div>

          {/* ── Right column (1/3, sticky) ── */}
          <div className="lg:sticky lg:top-24">
            <PaymentSummaryPanel
              booking={booking}
              flight={passedFlight}
              inboundFlight={passedInboundFlight}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
