// src/pages/SeatSelectionChoicePage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Intermediate screen shown after the user finishes selecting flights.
// Presents a clean, deliberate choice: pick seats or go straight to checkout.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { formatPrice, formatDuration, getStopsLabel } from '../utils/flightUtils';
import { buildDraftPayload, createBookingDraft } from '../services/bookingService';

// ─── Mini flight row (used inside TripSummaryPanel) ──────────────────────────
function FlightMiniCard({ flight, cityMap }) {
  if (!flight) return null;
  const fmtAirport = (code) => cityMap?.[code] || code || '—';
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {flight.airlineLogo ? (
          <img
            src={flight.airlineLogo}
            alt={flight.airline}
            className="w-8 h-8 rounded-full object-contain bg-[#1F1F1F] flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex-shrink-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm">flight</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-label-md text-label-md text-primary truncate">{flight.airline}</p>
          <p className="font-label-sm text-label-sm text-outline truncate">
            {fmtAirport(flight.fromAirport)} → {fmtAirport(flight.toAirport)}
          </p>
          <p className="font-label-sm text-label-sm text-outline">
            {flight.departureTime} – {flight.arrivalTime} · {formatDuration(flight.duration)} · {getStopsLabel(flight.stops)}
          </p>
        </div>
      </div>
      <p className="font-label-md text-label-md text-primary flex-shrink-0">
        {formatPrice(flight.price, flight.currency)}
      </p>
    </div>
  );
}

// ─── Choice card ──────────────────────────────────────────────────────────────
function ChoiceCard({ icon, title, subtitle, ctaLabel, onClick, isPrimary, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-xl border transition-all duration-200 group ${
        disabled ? 'opacity-60 cursor-not-allowed ' : ''
      }${
        isPrimary
          ? 'bg-primary text-on-primary border-primary hover:opacity-[0.92]'
          : 'bg-[#121212] border-[#2C2C2C] hover:border-[#4A4A4A] hover:bg-[#181818]'
      }`}
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4 justify-between">
          <div className="flex-1">
            {/* Icon badge */}
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center mb-5 ${
                isPrimary ? 'bg-black/15' : 'bg-[#1F1F1F]'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${
                  isPrimary ? 'text-on-primary' : 'text-primary'
                }`}
              >
                {icon}
              </span>
            </div>

            <h3
              className={`font-headline-md text-headline-md mb-2 ${
                isPrimary ? 'text-on-primary' : 'text-primary'
              }`}
            >
              {title}
            </h3>
            <p
              className={`font-body-md text-body-md leading-relaxed ${
                isPrimary ? 'text-on-primary/70' : 'text-outline'
              }`}
            >
              {subtitle}
            </p>
          </div>

          {/* CTA arrow */}
          <div
            className={`flex-shrink-0 flex items-center gap-1.5 mt-1 transition-colors ${
              isPrimary
                ? 'text-on-primary/80'
                : 'text-outline group-hover:text-primary'
            }`}
          >
            <span className="font-label-md text-label-md whitespace-nowrap hidden sm:block">
              {ctaLabel}
            </span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Trip summary panel (right column) ───────────────────────────────────────
function TripSummaryPanel({ flight, inboundFlight, searchCriteria }) {
  const isRoundTrip = !!inboundFlight;
  const cityMap = {};
  if (searchCriteria?.from_airport && searchCriteria?.fromCity) cityMap[searchCriteria.from_airport] = searchCriteria.fromCity;
  if (searchCriteria?.to_airport && searchCriteria?.toCity) cityMap[searchCriteria.to_airport] = searchCriteria.toCity;
  const totalPassengers =
    parseInt(searchCriteria?.passengers?.adults ?? 1) +
    parseInt(searchCriteria?.passengers?.children ?? 0);

  const outboundPrice = parseFloat(flight?.price) || 0;
  const inboundPrice  = parseFloat(inboundFlight?.price) || 0;
  const totalPrice    = outboundPrice + inboundPrice;
  const currency      = flight?.currency || 'USD';

  return (
    <div className="bg-[#1F1F1F] border border-[#2C2C2C] rounded-xl p-6 shadow-[0_0_32px_rgba(0,0,0,0.4)]">
      <h2 className="font-headline-md text-headline-md text-primary mb-6">Trip Summary</h2>

      {/* Departure flight */}
      {isRoundTrip && (
        <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-3">
          Departure Flight
        </p>
      )}
      <FlightMiniCard flight={flight} cityMap={cityMap} />

      {/* Return flight */}
      {isRoundTrip && (
        <>
          <div className="my-5 border-t border-[#2C2C2C]" />
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-3">
            Return Flight
          </p>
          <FlightMiniCard flight={inboundFlight} cityMap={cityMap} />
        </>
      )}

      {/* Price breakdown */}
      <div className="mt-6 pt-5 border-t border-[#2C2C2C] space-y-2">
        {isRoundTrip && (
          <>
            <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
              <span>Departure</span>
              <span>{formatPrice(flight.price, currency)}</span>
            </div>
            <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
              <span>Return</span>
              <span>{formatPrice(inboundFlight.price, inboundFlight.currency)}</span>
            </div>
            <div className="pt-2 border-t border-[#2C2C2C]" />
          </>
        )}
        <div className="flex justify-between font-headline-md text-headline-md text-primary">
          <span>Total</span>
          <span>{formatPrice(totalPrice.toFixed(2), currency)}</span>
        </div>
        <p className="font-label-sm text-label-sm text-outline pt-1">
          {totalPassengers} passenger{totalPassengers !== 1 ? 's' : ''}
          {searchCriteria?.cabin_class ? ` · ${searchCriteria.cabin_class}` : ''}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SeatSelectionChoicePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { flight, inboundFlight, searchCriteria, passengers, contact, backUrl } = location.state || {};

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError,   setCheckoutError]   = useState(null);

  // Guard: redirect if no flight data
  useEffect(() => {
    if (!flight) navigate(backUrl || '/flights', { replace: true });
  }, [flight, navigate, backUrl]);

  if (!flight) return null;

  const isRoundTrip = !!inboundFlight;
  const adults = parseInt(searchCriteria?.passengers?.adults ?? 1);
  const children = parseInt(searchCriteria?.passengers?.children ?? 0);
  const totalPassengers = adults + children;
  const passengerLabel =
    totalPassengers === 1 ? '1 passenger' : `${totalPassengers} passengers`;

  // Count total flight segments (each connecting leg = 1 segment)
  const outSegs = flight?.segments?.length > 0 ? flight.segments.length : 1;
  const inSegs  = inboundFlight ? (inboundFlight?.segments?.length > 0 ? inboundFlight.segments.length : 1) : 0;
  const totalSegments = outSegs + inSegs;
  const segmentLabel  = totalSegments === 1 ? '1 flight' : `${totalSegments} flights`;

  const handleSelectSeats = () => {
    navigate('/seats', {
      state: { flight, inboundFlight, searchCriteria, passengers, contact, backUrl },
    });
  };

  const handleSkipToCheckout = async () => {
    if (checkoutLoading) return;
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      const payload = buildDraftPayload({
        flight, inboundFlight, searchCriteria, passengers, contact,
        selectedSeats: null,
      });
      const draft = await createBookingDraft(payload);
      navigate(`/payment/${encodeURIComponent(draft.booking_id)}`, {
        state: { flight, inboundFlight, searchCriteria, passengers, contact },
      });
    } catch (err) {
      setCheckoutError(err.message || 'Could not start checkout. Please try again.');
      setCheckoutLoading(false);
    }
  };

  // Back → return to passenger details, preserving their filled-in data
  const handleBack = () => {
    navigate('/passengers', {
      state: { flight, inboundFlight, searchCriteria, passengers, contact, backUrl },
    });
  };

  return (
    <div className="dark">
      <Navbar />

      <main className="max-w-7xl mx-auto px-container-margin py-8">
        {/* Back link */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-outline hover:text-primary transition-colors mb-6 font-label-md text-label-md"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to passenger details
        </button>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">

          {/* ── Left column (2/3) ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Heading */}
            <div>
              <h1 className="font-headline-lg text-headline-lg text-primary">Almost there.</h1>
              <p className="font-body-lg text-body-lg text-outline mt-2">
                Would you like to pick your seats before checking out?
              </p>
            </div>

            {/* Choice cards */}
            <div className="flex flex-col gap-4">
              <ChoiceCard
                isPrimary
                icon="airline_seat_recline_extra"
                title="Select Seats"
                subtitle={`Choose preferred seats across ${segmentLabel} for ${passengerLabel}. Takes about 2 minutes.`}
                ctaLabel="Choose seats"
                onClick={handleSelectSeats}
              />
              <ChoiceCard
                isPrimary={false}
                icon="skip_next"
                title={checkoutLoading ? 'Preparing checkout…' : 'Skip to Checkout'}
                subtitle="Seats will be automatically assigned at check-in."
                ctaLabel="Continue"
                onClick={handleSkipToCheckout}
                disabled={checkoutLoading}
              />
            </div>

            {checkoutError && (
              <div className="p-4 bg-error/20 border border-error rounded-xl text-error">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span>
                  <span className="font-label-md text-label-md">{checkoutError}</span>
                </div>
              </div>
            )}

            <p className="text-[11px] text-[#606060] leading-relaxed">
              Seat selection is complimentary · Preferences are subject to availability
            </p>
          </div>

          {/* ── Right column (1/3, sticky) ── */}
          <div className="lg:sticky lg:top-24">
            <TripSummaryPanel
              flight={flight}
              inboundFlight={inboundFlight}
              searchCriteria={searchCriteria}
            />
          </div>

        </div>
      </main>
    </div>
  );
}
