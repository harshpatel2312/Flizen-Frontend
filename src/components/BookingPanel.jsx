import { useState, useEffect } from 'react';
import AirportAutocomplete from './AirportAutocomplete';
import DatePickerField from './DatePickerField';
import PassengerSelector from './PassengerSelector';
import CabinClassSelector from './CabinClassSelector';
import { searchFlights } from '../services/apiService';

export default function BookingPanel({ onRouteSelect = null }) {
  const [fromAirport, setFromAirport] = useState(null);
  const [toAirport, setToAirport] = useState(null);
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState('Economy');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Update parent when route selection changes
  useEffect(() => {
    if (onRouteSelect) {
      onRouteSelect({
        from: fromAirport,
        to: toAirport,
      });
    }
  }, [fromAirport, toAirport, onRouteSelect]);

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

    if (returnDate && departureDate && new Date(returnDate) <= new Date(departureDate)) {
      newErrors.return = 'Return date must be after departure date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle search
  const handleSearch = async () => {
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const searchParams = {
        from_airport: fromAirport.iata,
        to_airport: toAirport.iata,
        departure_date: departureDate,
        return_date: returnDate || null,
        passengers,
        cabin_class: cabinClass,
      };

      const results = await searchFlights(searchParams);
      setSearchResults(results);
      
      // TODO: Emit event or use context to pass results to parent
      console.log('Search results:', results);
    } catch (error) {
      setApiError(
        error.message || 'Failed to search flights. Please try again.'
      );
    } finally {
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
    <section className="bg-[#121212] rounded-xl p-6 border border-[#2C2C2C] flex flex-col gap-container-margin">
      <h2 className="font-headline-md text-headline-md text-primary">Book a Flight</h2>

      {/* Airports Section */}
      <div className="flex flex-col gap-element-gap relative">
        {/* From Airport */}
        <AirportAutocomplete
          label="From"
          placeholder="Where from?"
          icon="flight_takeoff"
          value={fromAirport?.iata || ''}
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
          className="absolute right-4 top-[calc(50%-16px)] bg-[#121212] border border-[#2C2C2C] rounded-full p-2 z-10 hover:bg-[#1F1F1F] hover:border-secondary transition-all"
        >
          <span className="material-symbols-outlined text-primary text-[18px]">
            swap_vert
          </span>
        </button>

        {/* To Airport */}
        <AirportAutocomplete
          label="To"
          placeholder="Where to?"
          icon="flight_land"
          value={toAirport?.iata || ''}
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
      <div className="grid grid-cols-2 gap-element-gap">
        <DatePickerField
          label="Departure"
          icon="calendar_today"
          value={departureDate}
          onChange={(date) => {
            setDepartureDate(date);
            setErrors({ ...errors, departure: undefined });
          }}
          error={errors.departure}
        />

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
      </div>

      {/* Passengers & Class Section */}
      <div className="grid grid-cols-2 gap-element-gap border-b border-[#2C2C2C] pb-container-margin">
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
          className="bg-primary text-on-primary font-label-md text-label-md font-bold py-4 rounded-lg w-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && (
            <span className="material-symbols-outlined animate-spin">
              progress_activity
            </span>
          )}
          {isLoading ? 'Searching...' : 'Search Flights'}
        </button>
        <button className="bg-transparent border border-[#2C2C2C] text-primary font-label-md text-label-md py-4 rounded-lg w-full hover:bg-[#1F1F1F] transition-colors">
          Track Flight
        </button>
      </div>
    </section>
  );
}
