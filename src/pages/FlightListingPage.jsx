import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RouteInfoHeader from '../components/RouteInfoHeader';
import FlightFilters from '../components/FlightFilters';
import FlightListCard from '../components/FlightListCard';
import FlightDetailsPanel from '../components/FlightDetailsPanel';
import { searchFlights, transformFlightData } from '../services/flightService';
import { sortFlights } from '../utils/flightUtils';
import { parseSearchParams } from '../utils/searchParamUtils';

export default function FlightListingPage() {
  const [searchParams] = useSearchParams();
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [sortBy, setSortBy] = useState('best');
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchCriteria, setSearchCriteria] = useState(null);

  // Parse search params from URL
  useEffect(() => {
    const params = parseSearchParams(searchParams);
    setSearchCriteria(params);
  }, [searchParams]);

  // Fetch flights when search criteria changes
  useEffect(() => {
    if (!searchCriteria) return;

    const fetchFlights = async () => {
      setLoading(true);
      setError(null);
      setSelectedFlight(null);

      try {
        const response = await searchFlights(searchCriteria);
        
        if (response.flights && response.flights.length > 0) {
          const transformed = response.flights.map(transformFlightData);
          setFlights(sortFlights(transformed, 'best'));
        } else {
          setFlights([]);
        }
      } catch (err) {
        setError(err.message || 'Could not load flights. Please try again.');
        setFlights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [searchCriteria]);

  const handleSortChange = (sortId) => {
    setSortBy(sortId);
    setFlights((prev) => sortFlights(prev, sortId));
    // Preserve the selected flight — no need to clear it
  };

  const handleFilterClick = () => {
    // TODO: Implement filter drawer/modal
  };

  const handleContinueBooking = (flight) => {
    // TODO: Navigate to checkout/payment page with flight details
  };

  if (!searchCriteria) {
    return (
      <div className="dark">
        <Navbar />
        <main className="max-w-7xl mx-auto px-container-margin py-8">
          <div className="flex items-center justify-center h-96">
            <p className="text-on-surface-variant">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dark">
      <Navbar />
      <main className="max-w-7xl mx-auto px-container-margin py-8">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-container transition-colors mb-6"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back to Home</span>
        </Link>

        {/* Header with Route Info */}
        <RouteInfoHeader
          fromAirport={`${searchCriteria.from_airport}`}
          toAirport={`${searchCriteria.to_airport}`}
          departDate={searchCriteria.departure_date}
          returnDate={searchCriteria.return_date}
          passengers={searchCriteria.passengers.adults + searchCriteria.passengers.children}
          cabinClass={searchCriteria.cabin_class}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-error/20 border border-error rounded-xl text-error">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <span>Could not load flights. Please try again.</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin mb-4">
                <span className="material-symbols-outlined text-4xl text-primary">flight_takeoff</span>
              </div>
              <p className="text-on-surface-variant font-label-sm">Loading flights...</p>
            </div>
          </div>
        )}

        {/* Filters & Results */}
        {!loading && !error && (
          <>
            <FlightFilters onSortChange={handleSortChange} onFilterClick={handleFilterClick} />

            {/* Main Content: Flight List & Booking Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
              {/* Left Column: Flight List */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {flights.length > 0 ? (
                  flights.map((flight) => (
                    <FlightListCard
                      key={flight.id}
                      flight={flight}
                      isSelected={selectedFlight?.id === flight.id}
                      onClick={() => setSelectedFlight(flight)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-[#2C2C2C] mb-4 block">
                      flight_takeoff
                    </span>
                    <p className="text-on-surface-variant font-label-sm">No flights found for this search</p>
                    <p className="text-[#666666] text-xs mt-2">Try adjusting your search criteria</p>
                  </div>
                )}
              </div>

              {/* Right Column: Flight Details */}
              <FlightDetailsPanel
                flight={selectedFlight}
                searchCriteria={searchCriteria}
                onContinue={handleContinueBooking}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
