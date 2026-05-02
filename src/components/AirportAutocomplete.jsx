import { useState, useEffect, useRef } from 'react';
import { searchAirports } from '../services/apiService';
import '../styles/AirportAutocomplete.css';

export default function AirportAutocomplete({
  label,
  placeholder,
  icon,
  value,
  onChange,
  onSelect,
  disabled = false,
  excludeAirport = null,
  error = null,
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Format airport display text
  const formatAirportDisplay = (airport) => {
    return `${airport.name} — ${airport.city}, ${airport.country} (${airport.iata})`;
  };

  // Handle input change
  const handleInputChange = async (e) => {
    const text = e.target.value;
    setQuery(text);
    setSelectedValue(text);
    onChange?.(text);

    if (text.length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchAirports(text);
      // Filter out excluded airport if provided
      const filtered = excludeAirport
        ? results.filter((a) => a.iata !== excludeAirport.iata)
        : results;
      setSuggestions(filtered);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion click
  const handleSelectAirport = (airport) => {
    setSelectedValue(airport.iata);
    setQuery(airport.iata);
    setSuggestions([]);
    setIsOpen(false);
    onSelect?.(airport);
  };

  // Sync with external value changes (for swap button)
  useEffect(() => {
    setSelectedValue(value || '');
    setQuery(value || '');
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Input Field */}
      <div
        className={`flex items-center bg-[#1F1F1F] rounded-full p-3 group focus-within:ring-2 transition-all ${
          error
            ? 'ring-2 ring-error-container border border-error-container'
            : 'focus-within:ring-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="material-symbols-outlined text-outline mr-3">{icon}</span>
        <div className="flex-1">
          <label className="font-label-sm text-label-sm text-outline block mb-1">
            {label}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={selectedValue}
            onChange={handleInputChange}
            onFocus={() => query.length >= 1 && suggestions.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="bg-transparent border-none text-primary font-body-md p-0 w-full focus:ring-0 placeholder:text-outline-variant disabled:opacity-50"
            autoComplete="off"
          />
        </div>
        {isLoading && (
          <span className="text-outline text-sm animate-pulse">Loading...</span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="text-error-container font-label-sm text-label-sm mt-2">
          {error}
        </div>
      )}

      {/* Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="airport-dropdown absolute top-full left-0 right-0 mt-2 bg-[#1F1F1F] rounded-lg border border-[#2C2C2C] shadow-lg z-50 max-h-80 overflow-y-auto">
          {suggestions.map((airport) => (
            <button
              key={airport.iata}
              onClick={() => handleSelectAirport(airport)}
              className="w-full px-4 py-3 text-left hover:bg-[#2C2C2C] transition-colors border-b border-[#2C2C2C] last:border-b-0 group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-body-md text-primary group-hover:text-secondary truncate">
                    {airport.name}
                  </div>
                  <div className="font-label-sm text-outline text-sm">
                    {airport.city}, {airport.country}
                  </div>
                </div>
                <div className="font-label-md text-white font-bold flex-shrink-0 group-hover:text-secondary transition-colors">
                  {airport.iata}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isOpen && query.length >= 1 && suggestions.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1F1F1F] rounded-lg border border-[#2C2C2C] shadow-lg z-50 p-4 text-center">
          <div className="text-outline-variant font-body-md">
            No airports found for "{query}"
          </div>
          <div className="text-outline font-label-sm text-sm mt-1">
            Try searching by city name, airport name, or IATA code
          </div>
        </div>
      )}
    </div>
  );
}
