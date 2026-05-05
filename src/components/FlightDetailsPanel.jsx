import { formatDuration, formatPrice, getStopsLabel, getLayovers } from '../utils/flightUtils';

export default function FlightDetailsPanel({ flight, searchCriteria, onContinue }) {
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

  const layovers = getLayovers(flight.segments);
  const durationLabel = formatDuration(flight.duration);
  const stopsLabel = getStopsLabel(flight.stops);
  const priceLabel = formatPrice(flight.price, flight.currency);

  const totalPassengers = searchCriteria
    ? (searchCriteria.passengers?.adults || 1) + (searchCriteria.passengers?.children || 0)
    : 1;

  const refundCond = flight.conditions?.refund_before_departure;
  const changeCond = flight.conditions?.change_before_departure;

  const hasConditions =
    refundCond?.allowed != null || changeCond?.allowed != null;

  const hasFareSection =
    flight.fareBrandName ||
    flight.cabinClass ||
    flight.baggages?.length > 0 ||
    hasConditions;

  const hasExtraInfo =
    flight.totalEmissionsKg != null ||
    flight.passportRequired != null;

  return (
    <div className="lg:sticky lg:top-24">
      <div className="bg-[#1F1F1F] border border-[#2C2C2C] rounded-xl p-6 shadow-[0_0_32px_rgba(0,0,0,0.4)] max-h-[calc(100vh-7rem)] overflow-y-auto flight-details-scroll">
        <h2 className="font-headline-md text-headline-md text-primary mb-6">Flight Details</h2>

        {/* ── Route overview ── */}
        <div className="mb-6 pb-6 border-b border-[#2C2C2C]">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-headline-sm text-headline-sm text-primary">{flight.fromAirport}</span>
            <span className="material-symbols-outlined text-outline text-base">arrow_right_alt</span>
            <span className="font-headline-sm text-headline-sm text-primary">{flight.toAirport}</span>
          </div>
          <p className="text-outline font-label-sm text-label-sm">
            {flight.airline}
            {flight.flightNumber ? ` · ${flight.flightNumber}` : ''}
          </p>
          <p className="text-outline font-label-sm text-label-sm mt-1">
            {flight.departureTime} – {flight.arrivalTime} · {durationLabel} · {stopsLabel}
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

        {/* ── Route breakdown (segments + layovers) ── */}
        {flight.segments.length > 0 && (
          <div className="mb-6 pb-6 border-b border-[#2C2C2C]">
            <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-3">
              Route
            </p>
            {flight.segments.map((seg, i) => (
              <div key={i}>
                {/* Segment row */}
                <div className="flex items-start gap-3 py-1">
                  <div className="flex flex-col items-center mt-1.5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {i < flight.segments.length - 1 && (
                      <div className="w-px flex-1 bg-[#2C2C2C] my-1" style={{ minHeight: '28px' }} />
                    )}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-label-md text-label-md text-primary">
                        {seg.origin} → {seg.destination}
                      </span>
                      <span className="font-label-sm text-label-sm text-outline ml-2 whitespace-nowrap">
                        {seg.departure_datetime?.slice(11, 16) || '--:--'}
                        {' – '}
                        {seg.arrival_datetime?.slice(11, 16) || '--:--'}
                      </span>
                    </div>
                    <p className="font-label-sm text-label-sm text-outline mt-0.5">
                      {seg.airline}
                      {seg.flight_number ? ` ${seg.flight_number}` : ''}
                      {seg.duration ? ` · ${formatDuration(seg.duration)}` : ''}
                    </p>
                    {seg.aircraft_name && (
                      <p className="font-label-sm text-label-sm text-[#666] mt-0.5">
                        {seg.aircraft_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Layover between segments */}
                {layovers[i] && (
                  <div className="flex items-center gap-2 pl-5 py-2 text-outline font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>
                      Layover at {layovers[i].airport}: {layovers[i].label}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Fare section ── */}
        {hasFareSection && (
          <div className="mb-6 pb-6 border-b border-[#2C2C2C] space-y-2">
            <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-3">
              Fare Details
            </p>

            {flight.fareBrandName && (
              <Row label="Fare type" value={flight.fareBrandName} />
            )}
            {flight.cabinClass && (
              <Row label="Cabin" value={flight.cabinClass} />
            )}
            {flight.baggages?.map((bag, i) => (
              <Row
                key={i}
                label={bag.type === 'carry_on' ? 'Carry-on' : 'Checked bag'}
                value={
                  bag.max_weight_kg
                    ? `${bag.quantity} x ${bag.max_weight_kg} kg`
                    : `${bag.quantity} bag${bag.quantity !== 1 ? 's' : ''}`
                }
              />
            ))}
            {refundCond?.allowed != null && (
              <Row
                label="Refundable"
                value={
                  refundCond.allowed
                    ? `Yes${refundCond.penalty_amount ? ` (fee: ${formatPrice(refundCond.penalty_amount, refundCond.penalty_currency)})` : ''}`
                    : 'No'
                }
                accent={refundCond.allowed ? 'green' : 'red'}
              />
            )}
            {changeCond?.allowed != null && (
              <Row
                label="Changes allowed"
                value={
                  changeCond.allowed
                    ? `Yes${changeCond.penalty_amount ? ` (fee: ${formatPrice(changeCond.penalty_amount, changeCond.penalty_currency)})` : ''}`
                    : 'No'
                }
                accent={changeCond.allowed ? 'green' : 'red'}
              />
            )}
          </div>
        )}

        {/* ── Extra info (CO2, passport) ── */}
        {hasExtraInfo && (
          <div className="mb-6 pb-6 border-b border-[#2C2C2C] space-y-2">
            <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-3">
              Additional Info
            </p>
            {flight.totalEmissionsKg != null && (
              <Row
                label="CO₂ emissions"
                value={`~${parseFloat(flight.totalEmissionsKg).toLocaleString('en-US')} kg`}
              />
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

        {/* ── Price ── */}
        <div className="mb-6 pb-6 border-b border-[#2C2C2C]">
          <div className="flex justify-between font-headline-md text-headline-md text-primary">
            <span>Price</span>
            <span>{priceLabel}</span>
          </div>
        </div>

        {/* ── CTA ── */}
        <button
          onClick={() => onContinue?.(flight)}
          className="w-full bg-primary text-on-primary font-label-md text-label-md font-bold py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// Small inline helper to keep JSX clean
function Row({ label, value, accent }) {
  const valueClass =
    accent === 'green'
      ? 'text-green-400'
      : accent === 'red'
      ? 'text-red-400'
      : accent === 'amber'
      ? 'text-amber-400'
      : 'text-outline';
  return (
    <div className="flex justify-between font-label-sm text-label-sm">
      <span className="text-outline">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
