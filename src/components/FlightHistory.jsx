import { useState, useEffect } from 'react';

export default function FlightHistory() {
  const [bookedFlights, setBookedFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch user's booked flights from backend API
    // For now, using mock data
    const mockFlights = [
      {
        id: 1,
        from: 'JFK',
        to: 'LHR',
        date: '2026-05-15',
        time: '14:30',
        airline: 'British Airways',
        flightNumber: 'BA112',
        status: 'Confirmed',
      },
      {
        id: 2,
        from: 'LAX',
        to: 'ORD',
        date: '2026-04-10',
        time: '08:00',
        airline: 'United Airlines',
        flightNumber: 'UA456',
        status: 'Completed',
      },
      {
        id: 3,
        from: 'MIA',
        to: 'LIH',
        date: '2026-06-22',
        time: '10:45',
        airline: 'Hawaiian Airlines',
        flightNumber: 'HA789',
        status: 'Cancelled',
      },
    ];

    // Simulate API call delay
    setTimeout(() => {
      setBookedFlights(mockFlights);
      setLoading(false);
    }, 300);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-500/20 text-green-400';
      case 'Completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'Cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <section className="bg-[#121212] rounded-xl border border-[#2C2C2C] h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <span className="material-symbols-outlined text-4xl text-primary">
              flight_takeoff
            </span>
          </div>
          <p className="text-[#888888] font-label-sm">Loading your flights...</p>
        </div>
      </section>
    );
  }

  if (bookedFlights.length === 0) {
    return (
      <section className="bg-[#121212] rounded-xl border border-[#2C2C2C] h-[500px] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-[#2C2C2C] mb-4 block">
            flight_takeoff
          </span>
          <p className="text-[#888888] font-label-sm">No booked flights yet</p>
          <p className="text-[#666666] text-xs mt-2">Start booking to see your flights here</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#121212] rounded-xl border border-[#2C2C2C] overflow-hidden">
      <div className="px-4 py-3.5 border-b border-[#2C2C2C]">
        <h3 className="font-label-lg text-label-lg text-white flex items-center gap-2">
          <span className="material-symbols-outlined">airplane_ticket</span>
          Recent Trips
        </h3>
      </div>
      <div className="max-h-[450px] overflow-y-auto">
        {bookedFlights.map((flight) => (
          <div
            key={flight.id}
            className="px-4 py-3 border-b border-[#2C2C2C] hover:bg-[#1F1F1F] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">

              {/* Left: departure code + airline name */}
              <div className="w-28 flex-shrink-0">
                <p className="text-white text-xl font-semibold leading-tight tracking-wide">
                  {flight.from}
                </p>
                <p className="text-[#AAAAAA] text-xs mt-1 leading-tight whitespace-nowrap">
                  {flight.airline}
                </p>
              </div>

              {/* Center: route line with airplane icon — capped width so it doesn't stretch */}
              <div className="flex-1 flex items-center min-w-0 max-w-[140px] mx-auto">
                <div className="flex-1 h-px bg-[#2E2E2E]" />
                <span
                  className="material-symbols-outlined text-[14px] text-primary leading-none flex-shrink-0 mx-1.5"
                  style={{ verticalAlign: 'middle' }}
                >
                  flight_takeoff
                </span>
                <div className="flex-1 h-px bg-[#2E2E2E]" />
              </div>

              {/* Right: destination code + separator + badge on top, date below */}
              <div className="w-52 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <p className="text-white text-xl font-semibold leading-tight tracking-wide">
                    {flight.to}
                  </p>
                  <span className="text-[#3C3C3C] text-sm select-none leading-none px-0.5">|</span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-medium whitespace-nowrap min-w-[80px] text-center ${getStatusColor(flight.status)}`}
                  >
                    {flight.status}
                  </span>
                </div>
                <p className="text-[#AAAAAA] text-xs mt-1 leading-tight whitespace-nowrap">
                  {formatDate(flight.date)}
                </p>
              </div>

            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
