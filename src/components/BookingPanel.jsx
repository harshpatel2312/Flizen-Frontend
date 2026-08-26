import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AirportAutocomplete from './AirportAutocomplete';
import DatePickerField from './DatePickerField';
import PassengerSelector from './PassengerSelector';
import CabinClassSelector from './CabinClassSelector';

export default function BookingPanel() {
  const navigate = useNavigate();
  const [fromAirport, setFromAirport] = useState(null);
  const [toAirport, setToAirport] = useState(null);
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState('Economy');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [tripType, setTripType] = useState('one-way');

  // Restore last search from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('flizen_last_search');
      if (!saved) return;
      const data = JSON.parse(saved);
      if (data.fromAirport) setFromAirport(data.fromAirport);
      if (data.toAirport) setToAirport(data.toAirport);
      if (data.departureDate) setDepartureDate(data.departureDate);
      if (data.returnDate) setReturnDate(data.returnDate);
      if (data.passengers) setPassengers(data.passengers);
      if (data.cabinClass) setCabinClass(data.cabinClass);
      if (data.tripType) setTripType(data.tripType);
    } catch {
      // ignore malformed data
    }
  }, []);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!fromAirport) {
      newErrors.from = 'Departure airport is required';
    }

    if (!toAirport) {
      newErrors.to = 'Arrival airport is required';
    }

    if (fromAirport && toAirport && fromAirport.iata === toAirport.iata) {
      newErrors.to = 'Departure and arrival airports cannot be the same';
    }

    if (!departureDate) {
      newErrors.departure = 'Departure date is required';
    }

    if (tripType === 'round-trip' && !returnDate) {
      newErrors.return = 'Return date is required for round trips';
    }

    if (returnDate && departureDate && new Date(returnDate) < new Date(departureDate)) {
      newErrors.return = 'Return date cannot be before departure date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle search - Navigate to flight listing page with search params
  const handleSearch = () => {
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        from: fromAirport.iata,
        to: toAirport.iata,
        departureDate: departureDate,
        adults: passengers.adults,
        children: passengers.children,
        infants: passengers.infants,
        cabinClass: cabinClass,
      });

      // Add return date if provided
      if (returnDate) {
        params.append('returnDate', returnDate);
      }
      params.append('tripType', tripType);

      // Persist search state so the form is pre-filled when navigating back
      sessionStorage.setItem(
        'flizen_last_search',
        JSON.stringify({ fromAirport, toAirport, departureDate, returnDate, passengers, cabinClass, tripType })
      );

      // Navigate to flight listing page with search params
      navigate(`/flights?${params.toString()}`);
    } catch (error) {
      setApiError(
        error.message || 'Failed to process search. Please try again.'
      );
      setIsLoading(false);
    }
  };

  // Handle swap airports
  const handleSwap = () => {
    const temp = fromAirport;
    setFromAirport(toAirport);
    setToAirport(temp);
    setErrors({});
  };

  return (
    <section className="bg-[#121212] rounded-xl p-5 border border-[#2C2C2C] flex flex-col gap-4">
      <h2 className="font-headline-md text-headline-md text-primary">Where to next?</h2>

      {/* Trip Type Toggle */}
      <div className="flex gap-1 bg-[#1A1A1A] border border-[#2C2C2C] rounded-full p-1 w-fit">
        {[
          { id: 'one-way', label: 'One Way' },
          { id: 'round-trip', label: 'Round Trip' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => {
              setTripType(id);
              if (id === 'one-way') setReturnDate('');
              setErrors({});
            }}
            className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-all ${
              tripType === id
                ? 'bg-primary text-on-primary font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Airports Section */}
      <div className="flex flex-col gap-element-gap relative">
        {/* From Airport */}
        <AirportAutocomplete
          label="From"
          placeholder="Where from?"
          icon="flight_takeoff"
          value={fromAirport ? (fromAirport.city ? `${fromAirport.city} (${fromAirport.iata})` : fromAirport.iata) : ''}
          onChange={(text) => {
            if (!text) {
              setFromAirport(null);
              setErrors({ ...errors, from: undefined });
            }
          }}
          onSelect={setFromAirport}
          error={errors.from}
        />

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          className="absolute right-4 top-[calc(50%-16px)] bg-[#121212] border border-[#2C2C2C] rounded-full p-2 z-10 hover:bg-[#1F1F1F] hover:border-white hover:ring-2 hover:ring-white focus:outline-none transition-all group"
        >
          <span className="material-symbols-outlined text-outline group-hover:text-primary text-[18px] transition-colors">
            swap_vert
          </span>
        </button>

        {/* To Airport */}
        <AirportAutocomplete
          label="To"
          placeholder="Where to?"
          icon="flight_land"
          value={toAirport ? (toAirport.city ? `${toAirport.city} (${toAirport.iata})` : toAirport.iata) : ''}
          onChange={(text) => {
            if (!text) {
              setToAirport(null);
              setErrors({ ...errors, to: undefined });
            }
          }}
          onSelect={setToAirport}
          excludeAirport={fromAirport}
          error={errors.to}
        />
      </div>

      {/* Dates Section */}
      <div className={`grid gap-element-gap ${tripType === 'round-trip' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <DatePickerField
          label="Departure"
          icon="calendar_today"
          value={departureDate}
          onChange={(date) => {
            setDepartureDate(date);
            setErrors({ ...errors, departure: undefined });
            // Clear stale return date if it is now before the new departure (same-day is allowed).
            if (returnDate && date && new Date(returnDate) < new Date(date)) {
              setReturnDate('');
              setErrors((prev) => ({ ...prev, departure: undefined, return: undefined }));
            }
          }}
          error={errors.departure}
        />

        {tripType === 'round-trip' && (
          <DatePickerField
            label="Return"
            icon="event_repeat"
            value={returnDate}
            onChange={(date) => {
              setReturnDate(date);
              setErrors({ ...errors, return: undefined });
            }}
            minDate={departureDate ? new Date(departureDate) : new Date()}
            error={errors.return}
          />
        )}
      </div>

      {/* Passengers & Class Section */}
      <div className="grid grid-cols-2 gap-element-gap border-b border-[#2C2C2C] pb-4">
        <PassengerSelector
          value={passengers}
          onChange={setPassengers}
        />
        <CabinClassSelector
          value={cabinClass}
          onChange={setCabinClass}
        />
      </div>

      {/* Error Message */}
      {apiError && (
        <div className="bg-error-container bg-opacity-20 border border-error-container rounded-lg p-4">
          <div className="flex gap-3 items-start">
            <span className="material-symbols-outlined text-error flex-shrink-0">
              error
            </span>
            <div>
              <div className="font-label-md text-error-container">Error</div>
              <div className="text-outline-variant font-body-md text-sm mt-1">
                {apiError}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-element-gap">
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="bg-primary text-on-primary font-label-md text-label-md font-bold py-3 rounded-full w-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && (
            <span className="material-symbols-outlined animate-spin">
              progress_activity
            </span>
          )}
          {isLoading ? 'Searching...' : 'Search Flights'}
        </button>
      </div>
    </section>
  );
}
