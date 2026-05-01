import { formatDuration, formatPrice, getStopsLabel } from '../utils/flightUtils';

export default function FlightListCard({ flight, isSelected, onClick }) {
  const durationLabel = formatDuration(flight.duration);
  const stopsLabel = getStopsLabel(flight.stops);
  const priceLabel = formatPrice(flight.price, flight.currency);

  // Sub-label: flight number + cabin/fare if available
  const subParts = [
    flight.flightNumber,
    flight.cabinClass || flight.fareBrandName,
  ].filter(Boolean);

  return (
    <article
      onClick={onClick}
      className={`rounded-xl p-6 relative overflow-hidden cursor-pointer transition-colors ${
        isSelected
          ? 'bg-[#121212] border-l-4 border-l-primary border border-primary'
          : 'bg-[#121212] border border-[#2C2C2C] hover:bg-[#1a1a1a]'
      }`}
    >
      {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-primary" />}

      {/* Header: Airline & Price */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {flight.airlineLogo ? (
            <img
              src={flight.airlineLogo}
              alt={flight.airline}
              className="w-8 h-8 rounded-full object-contain bg-[#1F1F1F]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-sm">flight</span>
            </div>
          )}
          <div>
            <p className="font-label-md text-label-md text-primary">{flight.airline}</p>
            <p className="font-label-sm text-label-sm text-outline">
              {subParts.join(' • ')}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="font-headline-md text-headline-md text-primary">{priceLabel}</p>
          {flight.fareBrandName && flight.cabinClass && (
            <p className="font-label-sm text-label-sm text-outline mt-0.5">{flight.fareBrandName}</p>
          )}
        </div>
      </div>

      {/* Timeline: Departure → Arrival */}
      <div className="flex items-center justify-between mt-6 relative">
        {/* Departure */}
        <div className="text-left w-1/4">
          <p className="font-headline-md text-headline-md text-primary">{flight.departureTime}</p>
          <p className="font-label-sm text-label-sm text-outline">{flight.fromAirport}</p>
        </div>

        {/* Duration & stops */}
        <div className="flex-1 flex flex-col items-center px-4 gap-1.5">
          <p className="font-label-sm text-label-sm text-outline leading-none">{durationLabel}</p>
          <div className="w-full flex items-center">
            <div className="w-2 h-2 rounded-full bg-outline shrink-0" />
            <div className="flex-1 h-px bg-[#2C2C2C]" />
            <div className="w-2 h-2 rounded-full bg-outline shrink-0" />
          </div>
          <p className="font-label-sm text-label-sm text-primary leading-none">{stopsLabel}</p>
        </div>

        {/* Arrival */}
        <div className="text-right w-1/4">
          <p className="font-headline-md text-headline-md text-primary">{flight.arrivalTime}</p>
          <p className="font-label-sm text-label-sm text-outline">{flight.toAirport}</p>
        </div>
      </div>

      {/* Baggage summary — only if data is available */}
      {flight.baggages?.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#2C2C2C] flex flex-wrap gap-3">
          {flight.baggages.map((bag, i) => (
            <span
              key={i}
              className="flex items-center gap-1 text-outline font-label-sm text-label-sm"
            >
              <span className="material-symbols-outlined text-sm">luggage</span>
              {bag.quantity}×{' '}
              {bag.type === 'carry_on' ? 'Carry-on' : 'Checked'}
              {bag.max_weight_kg ? ` (${bag.max_weight_kg}kg)` : ''}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

