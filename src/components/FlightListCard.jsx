import { formatDuration, formatPrice, getStopsLabel } from '../utils/flightUtils';
import { formatTripDate } from '../utils/trips';
import FlightCard, { FlightCardFooterItem, FlightTimeline } from './FlightCard';

// Duffel times are airport-local; formatTripDate keeps them on the airport's calendar day.
const fullDate = (value) => formatTripDate(value, { weekday: true, withYear: true });

export default function FlightListCard({ flight, isSelected, onClick, cityMap }) {
  const fmtAirport = (code) => {
    const city = cityMap?.[code];
    return city ? `${city} (${code})` : (code || '—');
  };

  // Fare tier (e.g. "Basic", "Basic Economy") sits top-right; cabin stays under the airline
  // unless it is already the tier shown.
  const tier = flight.fareBrandName || flight.cabinClass;
  const subParts = [
    flight.flightNumber,
    flight.fareBrandName ? flight.cabinClass : null,
  ].filter(Boolean);

  const aside = tier ? (
    <p className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">{tier}</p>
  ) : null;

  const price = (
    <>
      <p className="font-headline-md text-headline-md text-primary">{formatPrice(flight.price, flight.currency)}</p>
      {(flight.sliceCount ?? 1) > 1 && (
        <p className="font-label-sm text-label-sm text-outline mt-0.5">Round-trip total</p>
      )}
    </>
  );

  // Baggage summary — only if data is available
  const footer = flight.baggages?.length > 0
    ? flight.baggages.map((bag, i) => (
        <FlightCardFooterItem key={i} icon="luggage">
          {bag.quantity}×{' '}
          {bag.type === 'carry_on' ? 'Carry-on' : 'Checked'}
          {bag.max_weight_kg ? ` (${bag.max_weight_kg}kg)` : ''}
        </FlightCardFooterItem>
      ))
    : null;

  return (
    <FlightCard
      airline={flight.airline}
      airlineLogo={flight.airlineLogo}
      subParts={subParts}
      aside={aside}
      price={price}
      isSelected={isSelected}
      onClick={onClick}
      footer={footer}
    >
      <FlightTimeline
        departure={{ time: flight.departureTime, place: fmtAirport(flight.fromAirport), date: fullDate(flight.departureDateTime) }}
        arrival={{ time: flight.arrivalTime, place: fmtAirport(flight.toAirport), date: fullDate(flight.arrivalDateTime) }}
        duration={formatDuration(flight.duration)}
        stopsLabel={getStopsLabel(flight.stops)}
      />
    </FlightCard>
  );
}
