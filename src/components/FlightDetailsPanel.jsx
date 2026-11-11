import { formatDuration, formatPrice, getStopsLabel } from '../utils/flightUtils';
import Sep from './Sep';

export default function FlightDetailsPanel({ flight, inboundFlight, searchCriteria, cityMap: propCityMap, onContinue, ctaLabel = 'Continue Booking' }) {
  if (!flight) {
    return (
      <div className="lg:sticky lg:top-24">
        <div className="bg-[#1F1F1F] border border-[#2C2C2C] rounded-xl p-6 shadow-[0_0_32px_rgba(0,0,0,0.4)] max-h-[calc(100vh-7rem)] overflow-y-auto flight-details-scroll">
          <h2 className="font-headline-md text-headline-md text-primary mb-6">Flight Details</h2>
          <p className="text-on-surface-variant text-center py-8">Select a flight to see details</p>
        </div>
      </div>
    );
  }

  const totalPassengers = searchCriteria
    ? (searchCriteria.passengers?.adults || 1) + (searchCriteria.passengers?.children || 0)
    : 1;

  const isRoundTrip = !!inboundFlight;

  const cityMap = {
    ...(propCityMap || {}),
    ...(searchCriteria?.from_airport && searchCriteria?.fromCity ? { [searchCriteria.from_airport]: searchCriteria.fromCity } : {}),
    ...(searchCriteria?.to_airport && searchCriteria?.toCity ? { [searchCriteria.to_airport]: searchCriteria.toCity } : {}),
  };

  // Duffel bundles round-trip as one offer with one total_amount; both legs carry the same whole-offer price.
  const priceLabel = formatPrice(flight.price, flight.currency);

  return (
    <div className="lg:sticky lg:top-24">
      <div className="bg-[#1F1F1F] border border-[#2C2C2C] rounded-xl p-6 shadow-[0_0_32px_rgba(0,0,0,0.4)] max-h-[calc(100vh-7rem)] overflow-y-auto flight-details-scroll">
        <div className="flex items-start justify-between gap-3 mb-6">
          <h2 className="font-headline-md text-headline-md text-primary">Flight Details</h2>
          <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2C2C2C] text-primary font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[14px] leading-none">person</span>
            {totalPassengers}
            {searchCriteria?.cabin_class && (<><Sep />{searchCriteria.cabin_class}</>)}
          </span>
        </div>

        {/* ── Outbound flight block ── */}
        {isRoundTrip && (
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-3">
            Departure Flight
          </p>
        )}
        <FlightBlock flight={flight} totalPassengers={totalPassengers} cityMap={cityMap} />

        {/* ── Inbound flight block ── */}
        {isRoundTrip && (
          <>
            <div className="my-6 border-t border-[#2C2C2C]" />
            <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-3">
              Return Flight
            </p>
            <FlightBlock flight={inboundFlight} totalPassengers={totalPassengers} cityMap={cityMap} />
          </>
        )}

        {/* ── Price ── */}
        <div className="mt-6 pt-6 border-t border-[#2C2C2C] space-y-1">
          <div className="flex justify-between font-headline-md text-headline-md text-primary">
            <span>Total</span>
            <span>{priceLabel}</span>
          </div>
          {isRoundTrip && (
            <p className="font-label-sm text-label-sm text-outline">
              Bundled round-trip fare
            </p>
          )}
        </div>

        {/* ── CTA ── */}
        <button
          onClick={() => onContinue?.(flight)}
          className="block mx-auto mt-6 px-10 bg-primary text-on-primary font-label-md text-label-md font-bold py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Renders one flight's full detail block ───────────────────────────────────
function FlightBlock({ flight, totalPassengers, cityMap }) {
  const fmtAirport = (code) => {
    const city = cityMap?.[code];
    return city ? `${city} (${code})` : (code || '—');
  };
  const durationLabel = formatDuration(flight.duration);
  const stopsLabel  = getStopsLabel(flight.stops);

  const refundCond  = flight.conditions?.refund_before_departure;
  const changeCond  = flight.conditions?.change_before_departure;
  const hasConditions = refundCond?.allowed != null || changeCond?.allowed != null;
  const hasFareSection =
    flight.fareBrandName || flight.cabinClass || flight.baggages?.length > 0 || hasConditions;
  const hasExtraInfo =
    flight.totalEmissionsKg != null || flight.passportRequired != null;

  return (
    <>
      {/* Route overview */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-headline-sm text-headline-sm text-primary">{fmtAirport(flight.fromAirport)}</span>
          <span className="material-symbols-outlined text-outline text-base">arrow_right_alt</span>
          <span className="font-headline-sm text-headline-sm text-primary">{fmtAirport(flight.toAirport)}</span>
        </div>
        <p className="text-outline font-label-sm text-label-sm">
          {flight.airline}
          {flight.flightNumber && (<><Sep />{flight.flightNumber}</>)}
        </p>
        <p className="text-outline font-label-sm text-label-sm mt-1">
          {flight.departureTime} – {flight.arrivalTime}<Sep />{durationLabel}<Sep />{stopsLabel}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {flight.cabinClass && (
            <span className="bg-surface-container-high text-on-surface px-2 py-1 rounded-full font-label-sm text-label-sm">
              {flight.cabinClass}
            </span>
          )}
          <span className="bg-surface-container-high text-on-surface px-2 py-1 rounded-full font-label-sm text-label-sm">
            {totalPassengers} Passenger{totalPassengers > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Fare section */}
      {hasFareSection && (
        <div className="mb-4 pb-4 border-b border-[#2C2C2C] space-y-2">
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-3">Fare Details</p>
          {flight.fareBrandName && <Row label="Fare type" value={flight.fareBrandName} />}
          {flight.cabinClass    && <Row label="Cabin"     value={flight.cabinClass} />}
          {flight.baggages?.map((bag, i) => (
            <Row
              key={i}
              label={bag.type === 'carry_on' ? 'Carry-on' : 'Checked bag'}
              value={bag.max_weight_kg
                ? `${bag.quantity} x ${bag.max_weight_kg} kg`
                : `${bag.quantity} bag${bag.quantity !== 1 ? 's' : ''}`}
            />
          ))}
          {refundCond?.allowed != null && (
            <Row
              label="Refundable"
              value={refundCond.allowed
                ? `Yes${refundCond.penalty_amount ? ` (fee: ${formatPrice(refundCond.penalty_amount, refundCond.penalty_currency)})` : ''}`
                : 'No'}
              accent={refundCond.allowed ? 'green' : 'red'}
            />
          )}
          {changeCond?.allowed != null && (
            <Row
              label="Changes allowed"
              value={changeCond.allowed
                ? `Yes${changeCond.penalty_amount ? ` (fee: ${formatPrice(changeCond.penalty_amount, changeCond.penalty_currency)})` : ''}`
                : 'No'}
              accent={changeCond.allowed ? 'green' : 'red'}
            />
          )}
        </div>
      )}

      {/* Additional info */}
      {hasExtraInfo && (
        <div className="mb-2 space-y-2">
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-3">Additional Info</p>
          {flight.totalEmissionsKg != null && (
            <Row label="CO₂ emissions" value={`~${parseFloat(flight.totalEmissionsKg).toLocaleString('en-US')} kg`} />
          )}
          {flight.passportRequired != null && (
            <Row
              label="Passport at booking"
              value={flight.passportRequired ? 'Yes' : 'No'}
              accent={flight.passportRequired ? 'amber' : 'green'}
            />
          )}
        </div>
      )}
    </>
  );
}

// ─── Small inline row helper ──────────────────────────────────────────────────
function Row({ label, value, accent }) {
  const valueClass =
    accent === 'green'  ? 'text-green-400' :
    accent === 'red'    ? 'text-red-400'   :
    accent === 'amber'  ? 'text-amber-400' :
                          'text-outline';
  return (
    <div className="flex justify-between font-label-sm text-label-sm">
      <span className="text-outline">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
