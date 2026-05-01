export default function RouteInfoHeader({
  fromAirport,
  toAirport,
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

  return (
    <section className="mb-section-gap">
      <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Available Flights</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
        Choose the best flight for your trip
      </p>
      <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 text-on-surface">
        {/* Route Info */}
        <div className="flex items-center gap-2">
          <span className="font-label-md text-label-md text-primary">{fromAirport}</span>
          <span className="material-symbols-outlined text-outline">arrow_right_alt</span>
          <span className="font-label-md text-label-md text-primary">{toAirport}</span>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-4 bg-[#2C2C2C]"></div>

        {/* Trip Details */}
        <div className="flex items-center gap-4 text-outline font-label-md text-label-md flex-wrap md:flex-nowrap">
          <span>
            {formatDate(departDate)}
            {returnDate && ` - ${formatDate(returnDate)}`}
          </span>
          <span>•</span>
          <span>{passengers} Passenger{passengers > 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{cabinClass}</span>
        </div>
      </div>
    </section>
  );
}
