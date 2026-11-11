// src/components/trips/TripCard.jsx
// One booking in the My Trips list: route, dates, airline, travellers,
// status, airline reference, and amount. Selecting it opens the details panel.

import { pillClassFor, STATUS } from '../../utils/bookingStatus';
import { formatPrice } from '../../utils/flightUtils';
import {
  formatTimestamp,
  formatTripDate,
  isOfferExpired,
  tripDates,
  tripStatus,
} from '../../utils/trips';
import Sep from '../Sep';

/** Short status-specific hint shown under the route for trips that need attention. */
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

export default function TripCard({ booking, cityMap, isSelected, onSelect }) {
  const fs = booking.flight_summary || {};
  const { depart, ret } = tripDates(booking);
  const isRoundTrip = Boolean(fs.is_round_trip);
  const status = tripStatus(booking);
  const hint = hintFor(booking);
  const showRef = booking.status === STATUS.CONFIRMED && booking.duffel_booking_reference;
  const pax = booking.passenger_count || 0;
  const city = (code) => cityMap?.[code] || code || '—';

  return (
    <button
      type="button"
      onClick={() => onSelect(booking.booking_id)}
      aria-pressed={isSelected}
      className={`w-full text-left rounded-xl p-5 sm:p-6 relative overflow-hidden transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
        isSelected
          ? 'bg-[#121212] border-l-4 border-l-primary border border-primary'
          : 'bg-[#121212] border border-[#2C2C2C] hover:bg-[#1a1a1a]'
      }`}
    >
      {/* Airline + status */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          {fs.airline_logo_url ? (
            <img
              src={fs.airline_logo_url}
              alt=""
              className="w-8 h-8 rounded-full object-contain bg-[#1F1F1F] flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-sm">flight</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-label-md text-label-md text-primary truncate">{fs.airline || 'Airline'}</p>
            <p className="font-label-sm text-label-sm text-outline">
              {isRoundTrip ? 'Round trip' : 'One way'}
              {pax > 0 && (<><Sep />{pax} traveller{pax === 1 ? '' : 's'}</>)}
            </p>
          </div>
        </div>
        <span className={`flex-shrink-0 px-3 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${pillClassFor(status.tone)}`}>
          {status.label}
        </span>
      </div>

      {/* Route */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="min-w-0">
          <p className="font-headline-md text-headline-md text-primary truncate">{city(fs.from_airport)}</p>
          <p className="font-label-sm text-label-sm text-outline whitespace-nowrap">
            {fs.from_airport || '—'}
            {depart && (<><Sep />{formatTripDate(depart, { withYear: false, weekday: false })}</>)}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 w-14 sm:w-24" aria-hidden="true">
          <span className="material-symbols-outlined text-[18px] text-outline">
            {isRoundTrip ? 'sync_alt' : 'flight'}
          </span>
          <div className="w-full flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-outline shrink-0" />
            <div className="flex-1 h-px bg-[#2C2C2C]" />
            <div className="w-1.5 h-1.5 rounded-full bg-outline shrink-0" />
          </div>
        </div>
        <div className="min-w-0 text-right">
          <p className="font-headline-md text-headline-md text-primary truncate">{city(fs.to_airport)}</p>
          <p className="font-label-sm text-label-sm text-outline whitespace-nowrap">
            {fs.to_airport || '—'}
            {ret && (<><Sep />Return {formatTripDate(ret, { withYear: false, weekday: false })}</>)}
          </p>
        </div>
      </div>

      {hint && (
        <p className="mt-4 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] leading-none text-outline" aria-hidden="true">
            {hint.icon}
          </span>
          {hint.text}
        </p>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-[#2C2C2C] flex items-center justify-between gap-3">
        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap font-label-sm text-label-sm text-outline min-w-0">
          {showRef ? (
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">confirmation_number</span>
              Airline ref
              <span className="text-primary tracking-wider">{booking.duffel_booking_reference}</span>
            </span>
          ) : null}
          {booking.created_at && (
            <span>Booked {formatTripDate(new Date(booking.created_at), { weekday: false })}</span>
          )}
        </div>
        <p className="font-label-md text-label-md text-primary whitespace-nowrap">
          {formatPrice(booking.amount, booking.currency)}
        </p>
      </div>
    </button>
  );
}
