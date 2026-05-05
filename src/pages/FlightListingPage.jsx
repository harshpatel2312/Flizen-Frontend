import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RouteInfoHeader from '../components/RouteInfoHeader';
import FlightFilters from '../components/FlightFilters';
import FlightFilterPanel, { DEFAULT_FILTERS, TIME_SLOTS } from '../components/FlightFilterPanel';
import FlightListCard from '../components/FlightListCard';
import FlightDetailsPanel from '../components/FlightDetailsPanel';
import { searchFlights, transformFlightData } from '../services/flightService';
import { getFlightCache, setFlightCache, clearFlightCache } from '../services/flightCache';
import { getAirport } from '../services/apiService';
import { sortFlights, formatDuration, formatPrice, getStopsLabel } from '../utils/flightUtils';
import { parseSearchParams } from '../utils/searchParamUtils';

export default function FlightListingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [sortBy, setSortBy] = useState('best');
  const [allFlights, setAllFlights] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchCriteria, setSearchCriteria] = useState(null);
  const [fromCity, setFromCity] = useState(null);
  const [toCity, setToCity] = useState(null);
  const [phase, setPhase] = useState('outbound'); // 'outbound' | 'inbound'
  const [selectedOutbound, setSelectedOutbound] = useState(null);
  const [inboundFlights, setInboundFlights] = useState([]);
  const [inboundLoading, setInboundLoading] = useState(false);
  const [inboundError, setInboundError] = useState(null);

  // Parse search params from URL
  useEffect(() => {
    const params = parseSearchParams(searchParams);
    setSearchCriteria(params);

    // Fetch city names for display (non-blocking)
    const fetchCities = async () => {
      const [from, to] = await Promise.allSettled([
        getAirport(params.from_airport),
        getAirport(params.to_airport),
      ]);
      setFromCity(from.status === 'fulfilled' ? from.value?.city ?? null : null);
      setToCity(to.status === 'fulfilled' ? to.value?.city ?? null : null);
    };
    fetchCities();
  }, [searchParams]);

  // Fetch flights when search criteria changes
  useEffect(() => {
    if (!searchCriteria) return;

    // Reset round-trip state on new search
    setPhase('outbound');
    setSelectedOutbound(null);
    setInboundFlights([]);
    setInboundError(null);
    setSelectedFlight(null);

    const cacheKey = searchParams.toString();
    const cached = getFlightCache(cacheKey);

    if (cached) {
      setAllFlights(cached);
      setLoading(false);
      return;
    }

    const fetchFlights = async () => {
      setLoading(true);
      setError(null);
      setSelectedFlight(null);

      try {
        const response = await searchFlights(searchCriteria);

        if (response.flights && response.flights.length > 0) {
          const transformed = response.flights.map(transformFlightData);
          setFlightCache(cacheKey, transformed);
          setAllFlights(transformed);
        } else {
          setAllFlights([]);
        }
      } catch (err) {
        setError(err.message || 'Could not load flights. Please try again.');
        setAllFlights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [searchCriteria]);

  const isRoundTrip = searchCriteria?.trip_type === 'round-trip';

  const fetchInboundFlights = async () => {
    if (!searchCriteria) return;
    const cacheKey = `inbound_${searchParams.toString()}`;
    const cached = getFlightCache(cacheKey);
    if (cached) {
      setInboundFlights(cached);
      return;
    }
    setInboundLoading(true);
    setInboundError(null);
    const inboundCriteria = {
      ...searchCriteria,
      from_airport: searchCriteria.to_airport,
      to_airport: searchCriteria.from_airport,
      departure_date: searchCriteria.return_date,
      return_date: null,
    };
    try {
      const response = await searchFlights(inboundCriteria);
      if (response.flights && response.flights.length > 0) {
        const transformed = response.flights.map(transformFlightData);
        setFlightCache(cacheKey, transformed);
        setInboundFlights(transformed);
      } else {
        setInboundFlights([]);
      }
    } catch (err) {
      setInboundError(err.message || 'Could not load return flights.');
      setInboundFlights([]);
    } finally {
      setInboundLoading(false);
    }
  };

  const handleSortChange = (sortId) => {
    setSortBy(sortId);
  };

  const handleSelectOutbound = (flight) => {
    setSelectedOutbound(flight);
    setPhase('inbound');
    setSelectedFlight(null);
    setActiveFilters(DEFAULT_FILTERS);
    setSortBy('best');
    fetchInboundFlights();
  };

  const handleChangeOutbound = () => {
    setPhase('outbound');
    setSelectedOutbound(null);
    setSelectedFlight(null);
    setActiveFilters(DEFAULT_FILTERS);
    setSortBy('best');
  };

  const handleContinueBooking = (flight) => {
    if (isRoundTrip && phase === 'outbound') {
      handleSelectOutbound(flight);
      return;
    }
    navigate('/passengers', {
      state: {
        flight: isRoundTrip ? selectedOutbound : flight,
        inboundFlight: isRoundTrip ? flight : undefined,
        searchCriteria,
        backUrl: `/flights?${searchParams.toString()}`,
      },
    });
  };

  // Derive displayed flights from allFlights/inboundFlights, activeFilters, and sortBy
  const filteredFlights = useMemo(() => {
    let result = isRoundTrip && phase === 'inbound' ? inboundFlights : allFlights;
    const { stops, priceMax, airlines, timeSlots, duration } = activeFilters;
    if (stops.length > 0)
      result = result.filter((f) =>
        stops.some((s) => (s === 2 ? (f.stops ?? 0) >= 2 : (f.stops ?? 0) === s))
      );
    if (priceMax != null)
      result = result.filter((f) => parseFloat(f.price) <= priceMax);
    if (airlines.length > 0)
      result = result.filter((f) => airlines.includes(f.airline));
    if (timeSlots.length > 0)
      result = result.filter((f) => {
        const h = parseInt(f.departureTime?.split(':')[0] ?? '0', 10);
        return TIME_SLOTS.some((slot) => timeSlots.includes(slot.id) && h >= slot.start && h < slot.end);
      });
    if (duration === 'under-6') result = result.filter((f) => f.durationMinutes < 360);
    else if (duration === '6-12') result = result.filter((f) => f.durationMinutes >= 360 && f.durationMinutes < 720);
    else if (duration === '12-plus') result = result.filter((f) => f.durationMinutes >= 720);
    return result;
  }, [allFlights, inboundFlights, activeFilters, isRoundTrip, phase]);

  const displayedFlights = sortFlights(filteredFlights, sortBy);

  const activeFilterCount = [
    activeFilters.stops.length > 0,
    activeFilters.priceMax != null,
    activeFilters.airlines.length > 0,
    activeFilters.timeSlots.length > 0,
    activeFilters.duration != null,
  ].filter(Boolean).length;

  const activeLoading = isRoundTrip && phase === 'inbound' ? inboundLoading : loading;
  const activeError = isRoundTrip && phase === 'inbound' ? inboundError : error;

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
          onClick={clearFlightCache}
          className="inline-flex items-center gap-2 text-primary hover:text-primary-container transition-colors mb-6"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back to Home</span>
        </Link>

        {/* Header with Route Info */}
        <RouteInfoHeader
          heading={
            isRoundTrip
              ? (phase === 'outbound' ? 'Available Outbound Flights' : 'Available Inbound Flights')
              : 'Available Flights'
          }
          subheading={
            isRoundTrip
              ? (phase === 'outbound' ? 'Choose your departure flight' : 'Choose your return flight')
              : 'Choose the best flight for your trip'
          }
          fromAirport={isRoundTrip && phase === 'inbound' ? searchCriteria.to_airport : searchCriteria.from_airport}
          toAirport={isRoundTrip && phase === 'inbound' ? searchCriteria.from_airport : searchCriteria.to_airport}
          fromCity={isRoundTrip && phase === 'inbound' ? toCity : fromCity}
          toCity={isRoundTrip && phase === 'inbound' ? fromCity : toCity}
          departDate={isRoundTrip && phase === 'inbound' ? searchCriteria.return_date : searchCriteria.departure_date}
          returnDate={null}
          passengers={searchCriteria.passengers.adults + searchCriteria.passengers.children}
          cabinClass={searchCriteria.cabin_class}
        />

        {/* Error Message */}
        {activeError && (
          <div className="mb-6 p-4 bg-error/20 border border-error rounded-xl text-error">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <span>Could not load flights. Please try again.</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {activeLoading && (
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
        {!activeLoading && !activeError && (
          <>
            <FlightFilters
              onSortChange={handleSortChange}
              onFilterOpen={() => setIsFilterOpen(true)}
              activeFilterCount={activeFilterCount}
            />

            {/* Main Content: Flight List & Booking Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
              {/* Left Column: Flight List */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {/* Selected Departure Flight summary — shown in round-trip inbound phase */}
                {isRoundTrip && phase === 'inbound' && selectedOutbound && (
                  <div className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-xl px-6 py-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary">flight_takeoff</span>
                        <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest">Departure Flight</p>
                      </div>
                      <button
                        onClick={handleChangeOutbound}
                        className="font-label-sm text-label-sm text-primary hover:opacity-70 transition-opacity"
                      >
                        Change
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selectedOutbound.airlineLogo ? (
                          <img
                            src={selectedOutbound.airlineLogo}
                            alt={selectedOutbound.airline}
                            className="w-8 h-8 rounded-full object-contain bg-[#1F1F1F]"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-sm">flight</span>
                          </div>
                        )}
                        <div>
                          <p className="font-label-md text-label-md text-primary">{selectedOutbound.airline}</p>
                          <p className="font-label-sm text-label-sm text-outline mt-0.5">
                            {selectedOutbound.departureTime} → {selectedOutbound.arrivalTime}
                            {' · '}{formatDuration(selectedOutbound.duration)}
                            {' · '}{getStopsLabel(selectedOutbound.stops)}
                          </p>
                        </div>
                      </div>
                      <p className="font-label-md text-label-md text-primary">{formatPrice(selectedOutbound.price, selectedOutbound.currency)}</p>
                    </div>
                  </div>
                )}
                {displayedFlights.length > 0 ? (
                  displayedFlights.map((flight) => (
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
                    <p className="text-on-surface-variant font-label-sm">No flights match your filters</p>
                    <p className="text-[#666666] text-xs mt-2">
                      {activeFilterCount > 0 ? 'Try resetting filters or adjusting your criteria' : 'Try adjusting your search criteria'}
                    </p>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => setActiveFilters(DEFAULT_FILTERS)}
                        className="mt-4 px-4 py-2 rounded-full border border-[#2C2C2C] text-on-surface-variant font-label-md text-label-md hover:border-outline transition-colors"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Flight Details */}
              <FlightDetailsPanel
                flight={selectedFlight}
                searchCriteria={searchCriteria}
                onContinue={handleContinueBooking}
                ctaLabel={isRoundTrip && phase === 'outbound' ? 'Select Flight' : 'Continue Booking'}
              />
            </div>
          </>
        )}
      </main>

      <FlightFilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        allFlights={isRoundTrip && phase === 'inbound' ? inboundFlights : allFlights}
        filters={activeFilters}
        onApply={(f) => { setActiveFilters(f); setSelectedFlight(null); }}
      />
    </div>
  );
}
