// src/components/trips/TripCard.jsx
// One booking in the My Trips list, drawn with the same FlightCard as Find
// Your Flights. Booking extras: status top-right, travel dates under each
// airport, and a footer with the airline reference, booking date, and any hint.
// Selecting it opens the details panel.

import { pillClassFor, STATUS } from '../../utils/bookingStatus';
import { formatDuration, formatPrice, getStopsLabel } from '../../utils/flightUtils';
import {
  formatLocalTime,
  formatTimestamp,
  formatTripDate,
  isOfferExpired,
  tripAirline,
  tripLegs,
  tripStatus,
} from '../../utils/trips';
import FlightCard, { FlightCardFooterItem, FlightTimeline } from '../FlightCard';

/** Short status-specific hint for trips that need attention. */
function hintFor(booking) {
  const s = booking.status;
  if (s === STATUS.DRAFT) {
    const expires = booking.offer_expires_at && formatTimestamp(booking.offer_expires_at);
    return { icon: 'schedule', text: expires ? `Complete payment before ${expires}` : 'Payment not completed' };
  }
  if (s === STATUS.PAYMENT_FAILED) {
    return isOfferExpired(booking)
      ? { icon: 'credit_card_off', text: 'Payment was declined and the fare has expired' }
      : { icon: 'credit_card_off', text: 'Payment was declined — you can try again' };
  }
  if (s === STATUS.PAYMENT_RECEIVED || s === STATUS.FULFILLING) {
    return { icon: 'hourglass_top', text: 'Confirming your seats with the airline' };
  }
  if (s === STATUS.FAILED_REFUNDING) {
    return booking.refund_state === 'initiated' || !booking.refund_state
      ? { icon: 'currency_exchange', text: 'Airline booking failed — refund in progress' }
      : { icon: 'support_agent', text: 'Refund could not be completed — please contact support' };
  }
  return null;
}

const fullDate = (value) => formatTripDate(value, { weekday: true, withYear: true });

/** Bold italic "#" for the airline reference, in the footer icons' grey. */
function ReferenceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true">
      <path d="M10.5 3.5 7.5 20.5M17 3.5 14 20.5M4.5 8.75h16M3.5 15.25h16" />
    </svg>
  );
}
const place = (code, city) => (city && city !== code ? `${city} (${code})` : code || '—');

/** Timeline props for one leg. Bookings without a stored schedule show airports and date only. */
function legTimeline(leg) {
  if (!leg.hasSchedule) {
    return {
      departure: { time: leg.origin || '—', place: leg.originCity || '', date: fullDate(leg.departingAt) || '\u00A0' },
      arrival: { time: leg.destination || '—', place: leg.destinationCity || '', date: '\u00A0' },
      duration: null,
      stopsLabel: '',
    };
  }
  const stops = leg.stops ?? 0;
  return {
    departure: { time: formatLocalTime(leg.departingAt), place: place(leg.origin, leg.originCity), date: fullDate(leg.departingAt) },
    arrival: {
      time: formatLocalTime(leg.arrivingAt),
      place: place(leg.destination, leg.destinationCity),
      date: fullDate(leg.arrivingAt),
    },
    duration: leg.duration ? formatDuration(leg.duration) : null,
    stopsLabel: stops > 0 && leg.stopCodes.length
      ? `${getStopsLabel(stops)} · ${leg.stopCodes.join(', ')}`
      : getStopsLabel(stops),
  };
}

export default function TripCard({ booking, cityMap, isSelected, onSelect }) {
  const legs = tripLegs(booking, cityMap);
  const airline = tripAirline(booking);
  const isRoundTrip = legs.length > 1 || Boolean(booking.flight_summary?.is_round_trip);
  const status = tripStatus(booking);
  const hint = hintFor(booking);
  const reference = booking.status === STATUS.CONFIRMED ? booking.duffel_booking_reference : null;
  const bookedOn = booking.created_at && formatTripDate(new Date(booking.created_at), { weekday: false });
  const pax = booking.passenger_count || 0;

  // One-way flight numbers sit under the airline name; round trips label each leg instead.
  const subParts = [
    !isRoundTrip ? legs[0]?.flightNumbers?.join(', ') : null,
    isRoundTrip ? 'Round trip' : 'One way',
    pax > 0 ? `${pax} traveller${pax === 1 ? '' : 's'}` : null,
  ].filter(Boolean);

  const aside = (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${pillClassFor(status.tone)}`}>
      {status.label}
    </span>
  );
  const price = (
    <p className="font-headline-md text-headline-md text-primary whitespace-nowrap">
      {formatPrice(booking.amount, booking.currency)}
    </p>
  );

  const footerItems = [
    bookedOn && <FlightCardFooterItem key="booked" icon="event">Booked {bookedOn}</FlightCardFooterItem>,
    reference && (
      <FlightCardFooterItem
        key="ref"
        icon={<ReferenceIcon />}
      >
        <span className="text-primary tracking-wider" title="Airline reference">
          <span className="sr-only">Airline reference </span>{reference}
        </span>
      </FlightCardFooterItem>
    ),
    hint && <FlightCardFooterItem key="hint" icon={hint.icon}>{hint.text}</FlightCardFooterItem>,
  ].filter(Boolean);

  return (
    <FlightCard
      as="button"
      type="button"
      aria-pressed={isSelected}
      airline={airline.name || 'Airline'}
      airlineLogo={airline.logoUrl}
      airlineCode={airline.iataCode}
      subParts={subParts}
      aside={aside}
      price={price}
      isSelected={isSelected}
      onClick={() => onSelect(booking.booking_id)}
      footer={footerItems.length ? footerItems : null}
    >
      {legs.length > 0 ? (
        legs.map((leg, i) => (
          <FlightTimeline key={i} {...legTimeline(leg)} label={leg.label} className={i === 0 ? 'mt-6' : 'mt-5'} />
        ))
      ) : (
        <p className="mt-6 font-label-md text-label-md text-on-surface-variant">Flight details unavailable</p>
      )}
    </FlightCard>
  );
}
