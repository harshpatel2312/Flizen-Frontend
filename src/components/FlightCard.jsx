export default function FlightCard({ flight }) {
  const { airline, airlineCode, class: flightClass, price, origin, destination, departureTime, arrivalTime, duration } = flight;

  return (
    <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-5 hover:bg-[#161616] transition-colors cursor-pointer group">
      {/* Header with Airline and Price */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-black font-bold text-xs">{airlineCode}</span>
          </div>
          <div>
            <span className="font-label-md text-label-md text-primary block">{airline}</span>
            <span className="font-label-sm text-label-sm text-outline">{flightClass}</span>
          </div>
        </div>
        <span className="font-headline-md text-headline-md text-primary">${price}</span>
      </div>

      {/* Flight Route */}
      <div className="flex justify-between items-center relative">
        <div className="text-left">
          <span className="font-headline-md text-headline-md text-primary block">{origin}</span>
          <span className="font-label-sm text-label-sm text-outline">{departureTime}</span>
        </div>

        {/* Flight Path line */}
        <div className="flex-1 px-4 relative flex items-center justify-center">
          <div className="h-[1px] w-full bg-[#2C2C2C] absolute top-1/2 -translate-y-1/2"></div>
          <div className="bg-[#1F1F1F] rounded-full px-2 py-0.5 border border-[#2C2C2C] relative z-10 flex items-center gap-1">
            <span className="material-symbols-outlined text-outline text-[12px]">flight</span>
            <span className="font-label-sm text-label-sm text-outline text-[10px]">{duration}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="font-headline-md text-headline-md text-primary block">{destination}</span>
          <span className="font-label-sm text-label-sm text-outline">{arrivalTime}</span>
        </div>
      </div>
    </div>
  );
}
