// src/components/FlightCard.jsx
// Shared flight card shell used by Find Your Flights (FlightListCard) and
// My Trips (TripCard): airline header with an optional aside, one timeline per
// journey direction, and a footer row with details and the price bottom-right.

import AirlineLogo from './AirlineLogo';
import Sep from './Sep';

/** Departure -> arrival row. `date` / `label` are optional extras. */
export function FlightTimeline({ departure, arrival, duration, stopsLabel, label, className = 'mt-6' }) {
  return (
    <div className={`flex items-center justify-between relative ${className}`}>
      <div className="text-left w-1/4">
        <p className="font-headline-md text-headline-md text-primary">{departure.time}</p>
        <p className="font-label-sm text-label-sm text-outline">{departure.place}</p>
        {departure.date && <p className="font-label-sm text-label-sm text-outline font-normal">{departure.date}</p>}
      </div>

      <div className="flex-1 flex flex-col items-center px-4 gap-1.5">
        <p className="font-label-sm text-label-sm text-outline leading-none">
          {label && <span className="uppercase tracking-widest">{label}{duration && <Sep />}</span>}
          {duration}
        </p>
        <div className="w-full flex items-center">
          <div className="w-2 h-2 rounded-full bg-outline shrink-0" />
          <div className="flex-1 h-px bg-[#2C2C2C]" />
          <div className="w-2 h-2 rounded-full bg-outline shrink-0" />
        </div>
        <p className="font-label-sm text-label-sm text-primary leading-none">{stopsLabel}</p>
      </div>

      <div className="text-right w-1/4">
        <p className="font-headline-md text-headline-md text-primary">{arrival.time}</p>
        <p className="font-label-sm text-label-sm text-outline">{arrival.place}</p>
        {arrival.date && <p className="font-label-sm text-label-sm text-outline font-normal">{arrival.date}</p>}
      </div>
    </div>
  );
}

export default function FlightCard({
  as: Tag = 'article',
  airline,
  airlineLogo,
  airlineCode,
  subParts = [],
  aside,
  price,
  isSelected,
  onClick,
  footer,
  children,
  ...rest
}) {
  return (
    <Tag
      onClick={onClick}
      className={`w-full text-left rounded-xl p-6 relative overflow-hidden cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
        isSelected
          ? 'bg-[#121212] border-l-4 border-l-primary border border-primary'
          : 'bg-[#121212] border border-[#2C2C2C] hover:bg-[#1a1a1a]'
      }`}
      {...rest}
    >
      {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-primary" />}

      {/* Header: Airline & aside (e.g. status) */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <AirlineLogo src={airlineLogo} iataCode={airlineCode} name={airline} className="w-8 h-8" />
          <div className="min-w-0">
            <p className="font-label-md text-label-md text-primary truncate">{airline}</p>
            <p className="font-label-sm text-label-sm text-outline">
              {subParts.map((p, i) => (
                <span key={i} className="whitespace-nowrap">{i > 0 && <Sep />}{p}</span>
              ))}
            </p>
          </div>
        </div>
        {aside && <div className="text-right shrink-0">{aside}</div>}
      </div>

      {children}

      {/* Footer: details on the left, price in the bottom-right corner */}
      {(footer || price) && (
        <div className="mt-4 pt-3 border-t border-[#2C2C2C] flex items-end justify-between gap-4">
          <div className="flex flex-wrap gap-x-4 gap-y-2 min-w-0">{footer}</div>
          {price && <div className="text-right shrink-0">{price}</div>}
        </div>
      )}
    </Tag>
  );
}

/** Small icon + text item for a card footer (baggage, booking reference, ...). `icon` is a
 *  Material Symbols name or a custom element. */
export function FlightCardFooterItem({ icon, children }) {
  return (
    <span className="flex items-center gap-1 text-outline font-label-sm text-label-sm">
      {typeof icon === 'string'
        ? <span className="material-symbols-outlined text-sm" aria-hidden="true">{icon}</span>
        : icon}
      {children}
    </span>
  );
}
