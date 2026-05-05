// src/components/FlightHistory.jsx
// ---------------------------------------------------------------------------
// Displays the signed-in user's trip history.
// Bookings database is not yet set up — shows an empty state until real data
// can be fetched from Firestore per user uid.
//
// Future integration point:
//   import { collection, query, where, getDocs } from 'firebase/firestore';
//   const q = query(collection(db, 'bookings'), where('uid', '==', user.uid));
// ---------------------------------------------------------------------------

export default function FlightHistory() {
  // TODO: When Firestore bookings are ready, fetch trips for user.uid here.
  const bookedFlights = [];

  if (bookedFlights.length === 0) {
    return (
      <section className="bg-[#121212] rounded-xl border border-[#2C2C2C] h-[500px] flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4 px-6">
          <span className="material-symbols-outlined text-5xl text-[#2C2C2C] block">
            flight_takeoff
          </span>
          <div>
            <p className="text-white font-label-lg text-label-lg">No trips yet</p>
            <p className="text-[#888888] text-sm mt-1">
              Your next journey is just a few taps away.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':  return 'bg-green-500/20 text-green-400';
      case 'Completed':  return 'bg-blue-500/20 text-blue-400';
      case 'Cancelled':  return 'bg-red-500/20 text-red-400';
      default:           return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

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
              <div className="w-28 flex-shrink-0">
                <p className="text-white text-xl font-semibold leading-tight tracking-wide">
                  {flight.from}
                </p>
                <p className="text-[#AAAAAA] text-xs mt-1 leading-tight whitespace-nowrap">
                  {flight.airline}
                </p>
              </div>
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

