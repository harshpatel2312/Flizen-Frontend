import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RouteInfoHeader from '../components/RouteInfoHeader';
import FlightFilters from '../components/FlightFilters';
import FlightFilterPanel, { DEFAULT_FILTERS, TIME_SLOTS } from '../components/FlightFilterPanel';
import FlightListCard from '../components/FlightListCard';
import FlightDetailsPanel from '../components/FlightDetailsPanel';
import Sep from '../components/Sep';
import { searchFlights, transformFlightData, transformOfferToRoundTripPair } from '../services/flightService';
import { getFlightCache, setFlightCache, clearFlightCache } from '../services/flightCache';
import { getAirport } from '../services/apiService';
import { sortFlights, formatDuration, formatPrice, getStopsLabel } from '../utils/flightUtils';
import { parseSearchParams } from '../utils/searchParamUtils';
import { recallFlowState, rememberFlowState } from '../utils/bookingFlowMemory';

export default function FlightListingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  // Captures restore-state passed from SeatSelectionChoicePage on back-navigation.
  // Using a ref so it is consumed exactly once and doesn't re-trigger effects.
  const restoreRef = useRef(locationState?.restoreInbound ?? null);
  // Remembered selections (sort, filters, picked flights) for this exact search,
  // applied once flights are loaded. Selections are only saved after hydration so
  // the initial default state never overwrites what was remembered.
  const memoryKey = `listing:${searchParams.toString()}`;
  const pendingMemoryRef = useRef(null);
  const hydratedRef = useRef(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [sortBy, setSortBy] = useState('best');
  const [allFlights, setAllFlights] = useState([]);
  // Round-trip only: one entry per Duffel offer with matched outbound/inbound
  // display objects that share the offer id. This is the ONE bookable unit.
  const [pairs, setPairs] = useState([]);
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
  const [inboundLoading] = useState(false);
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

    // Consume any back-navigation restore state exactly once
    const restore = restoreRef.current;
    restoreRef.current = null;
    hydratedRef.current = Boolean(restore);
    pendingMemoryRef.current = restore ? null : recallFlowState(memoryKey);

    if (restore) {
      // Restore to inbound-selection phase (user pressed Back from seat-choice)
      setPhase('inbound');
      setSelectedOutbound(restore.outboundFlight);
      setSelectedFlight(restore.selectedFlight ?? null);
      setInboundFlights([]);
      setInboundError(null);
    } else {
      // Fresh navigation — reset round-trip state
      setPhase('outbound');
      setSelectedOutbound(null);
      setInboundFlights([]);
      setInboundError(null);
      setSelectedFlight(null);
    }

    const cacheKey = searchParams.toString();
    const cached = getFlightCache(cacheKey);

    if (cached) {
      setAllFlights(cached.flights || cached);
      setPairs(cached.pairs || []);
      setLoading(false);
      return;
    }

    const fetchFlights = async () => {
      setLoading(true);
      setError(null);
      if (!restore) setSelectedFlight(null);

      try {
        const response = await searchFlights(searchCriteria);
        const rawOffers = response.flights || [];
        const isRT = searchCriteria.trip_type === 'round-trip' && !!searchCriteria.return_date;

        if (isRT) {
          // Round-trip: derive matched outbound+inbound pairs from single offers.
          const pairsArr = rawOffers
            .map(transformOfferToRoundTripPair)
            .filter(Boolean);
          const outbounds = pairsArr.map((p) => p.outbound);
          setPairs(pairsArr);
          setAllFlights(outbounds);
          setFlightCache(cacheKey, { flights: outbounds, pairs: pairsArr });
        } else {
          const transformed = rawOffers.map(transformFlightData);
          setPairs([]);
          setAllFlights(transformed);
          setFlightCache(cacheKey, { flights: transformed, pairs: [] });
        }
      } catch (err) {
        setError(err.message || 'Could not load flights. Please try again.');
        setAllFlights([]);
        setPairs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [searchCriteria]);

  const isRoundTrip = searchCriteria?.trip_type === 'round-trip';

  // Apply remembered selections once the flight list for this search is ready.
  useEffect(() => {
    if (!searchCriteria || loading || hydratedRef.current) return;
    const mem = pendingMemoryRef.current;
    pendingMemoryRef.current = null;
    if (mem) {
      if (mem.sortBy) setSortBy(mem.sortBy);
      if (mem.activeFilters) setActiveFilters({ ...DEFAULT_FILTERS, ...mem.activeFilters });
      if (isRoundTrip && mem.phase === 'inbound' && mem.selectedOutboundOfferId) {
        const pair = pairs.find((p) => p.offerId === mem.selectedOutboundOfferId);
        if (pair) {
          setSelectedOutbound(pair.outbound);
          setPhase('inbound');
          if (mem.selectedFlightId === pair.inbound.id) setSelectedFlight(pair.inbound);
        }
      } else if (mem.selectedFlightId) {
        const match = allFlights.find((f) => f.id === mem.selectedFlightId);
        if (match) setSelectedFlight(match);
      }
    }
    hydratedRef.current = true;
  }, [searchCriteria, loading, allFlights, pairs, isRoundTrip]);

  // Remember selections for this search while the user browses.
  useEffect(() => {
    if (!hydratedRef.current) return;
    rememberFlowState(memoryKey, {
      sortBy,
      activeFilters,
      phase,
      selectedOutboundOfferId: selectedOutbound?.offerId ?? null,
      selectedFlightId: selectedFlight?.id ?? null,
    });
  }, [memoryKey, sortBy, activeFilters, phase, selectedOutbound, selectedFlight]);

  // Return list for round-trip is deterministic once the outbound is picked:
  // it is exactly the inbound slice of the SAME Duffel offer.
  const derivedInboundFlights = useMemo(() => {
    if (!isRoundTrip || phase !== 'inbound' || !selectedOutbound) return [];
    const p = pairs.find((x) => x.offerId === selectedOutbound.offerId);
    return p ? [p.inbound] : [];
  }, [pairs, isRoundTrip, phase, selectedOutbound]);

  const handleSortChange = (sortId) => {
    setSortBy(sortId);
  };

  const handleSelectOutbound = (flight) => {
    setSelectedOutbound(flight);
    setPhase('inbound');
    setSelectedFlight(null);
    setActiveFilters(DEFAULT_FILTERS);
    setSortBy('best');
    // Inbound list is derived from `pairs` in a useMemo — no fetch required.
    setInboundFlights([]);
    setInboundError(null);
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
        searchCriteria: { ...searchCriteria, fromCity, toCity },
        backUrl: `/flights?${searchParams.toString()}`,
      },
    });
  };

  // Derive displayed flights from allFlights/derivedInboundFlights, activeFilters, and sortBy
  const filteredFlights = useMemo(() => {
    let result = isRoundTrip && phase === 'inbound' ? derivedInboundFlights : allFlights;
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
  }, [allFlights, derivedInboundFlights, activeFilters, isRoundTrip, phase]);

  const displayedFlights = sortFlights(filteredFlights, sortBy);

  const cityMap = useMemo(() => {
    const m = {};
    if (searchCriteria?.from_airport && fromCity) m[searchCriteria.from_airport] = fromCity;
    if (searchCriteria?.to_airport && toCity) m[searchCriteria.to_airport] = toCity;
    return m;
  }, [searchCriteria, fromCity, toCity]);

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
              ? (phase === 'outbound' ? 'Departure Flight' : 'Return Flight')
              : 'Find Your Flight'
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
              <div className="animate-pulse mb-4">
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
              value={sortBy}
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
                            <Sep />{formatDuration(selectedOutbound.duration)}
                            <Sep />{getStopsLabel(selectedOutbound.stops)}
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
                      cityMap={cityMap}
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
                cityMap={cityMap}
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
