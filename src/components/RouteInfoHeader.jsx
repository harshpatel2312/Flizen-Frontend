export default function RouteInfoHeader({
  fromAirport,
  toAirport,
  fromCity,
  toCity,
  departDate,
  returnDate,
  passengers,
  cabinClass,
}) {
  const formatDate = (date) => {
    if (!date) return '';
    const options = { month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
  };

  const formatAirport = (iata, city) =>
    city ? `${city} (${iata})` : iata;

  return (
    <section className="mb-section-gap">
      <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Available Flights</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
        Choose the best flight for your trip
      </p>
      <div className="flex justify-start">
        <div className="inline-flex items-center gap-3 bg-[#121212] border border-[#2C2C2C] rounded-full px-5 py-3 text-on-surface flex-wrap">
        {/* Route Info */}
        <div className="flex items-center gap-2">
          <span className="font-label-md text-label-md text-primary">{formatAirport(fromAirport, fromCity)}</span>
          <span className="material-symbols-outlined text-outline">arrow_right_alt</span>
          <span className="font-label-md text-label-md text-primary">{formatAirport(toAirport, toCity)}</span>
        </div>

        {/* Divider */}
        <span className="text-zinc-600 select-none">|</span>

        {/* Trip Details */}
        <div className="flex items-center gap-3 text-outline font-label-md text-label-md flex-wrap">
          <span>
            {formatDate(departDate)}
            {returnDate && ` - ${formatDate(returnDate)}`}
          </span>
          <span className="text-zinc-600 select-none">|</span>
          <span>{passengers} Passenger{passengers > 1 ? 's' : ''}</span>
          <span className="text-zinc-600 select-none">|</span>
          <span>{cabinClass}</span>
        </div>
        </div>
      </div>
    </section>
  );
}
