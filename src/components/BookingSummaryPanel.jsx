export default function BookingSummaryPanel({ flight, onContinueBooking }) {
  if (!flight) {
    return (
      <div className="lg:sticky lg:top-24">
        <div className="bg-[#1F1F1F] border border-[#2C2C2C] rounded-xl p-6 shadow-[0_0_32px_rgba(0,0,0,0.4)]">
          <h2 className="font-headline-md text-headline-md text-primary mb-6">Booking Summary</h2>
          <p className="text-on-surface-variant text-center py-8">Select a flight to see booking details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:sticky lg:top-24">
      <div className="bg-[#1F1F1F] border border-[#2C2C2C] rounded-xl p-6 shadow-[0_0_32px_rgba(0,0,0,0.4)]">
        <h2 className="font-headline-md text-headline-md text-primary mb-6">Booking Summary</h2>

        {/* Flight Details */}
        <div className="mb-6 pb-6 border-b border-[#2C2C2C]">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-md text-label-md text-on-surface">
              {flight.fromAirport} to {flight.toAirport}
            </span>
            <span className="font-label-md text-label-md text-outline">{flight.date}</span>
          </div>
          <div className="flex justify-between items-center text-outline font-label-sm text-label-sm">
            <span>
              {flight.airline} • {flight.flightNumber}
            </span>
            <span>
              {flight.departureTime} - {flight.arrivalTime}
            </span>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="bg-surface-container-high text-on-surface px-2 py-1 rounded-full font-label-sm text-label-sm">
              {flight.cabinClass}
            </span>
            <span className="bg-surface-container-high text-on-surface px-2 py-1 rounded-full font-label-sm text-label-sm">
              1 Adult
            </span>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between font-body-md text-body-md text-outline">
            <span>Base Fare</span>
            <span>${flight.baseFare || flight.price - 250}</span>
          </div>
          <div className="flex justify-between font-body-md text-body-md text-outline">
            <span>Taxes & Fees</span>
            <span>${flight.taxes || 250}</span>
          </div>
          <div className="flex justify-between font-headline-md text-headline-md text-primary pt-3 border-t border-[#2C2C2C]">
            <span>Total</span>
            <span>${flight.price}</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onContinueBooking?.(flight)}
          className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 rounded-lg hover:bg-primary-container transition-colors"
        >
          Continue Booking
        </button>
      </div>
    </div>
  );
}
