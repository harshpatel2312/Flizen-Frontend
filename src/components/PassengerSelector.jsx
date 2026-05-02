import { useState, useRef, useEffect } from 'react';

export default function PassengerSelector({
  value = { adults: 1, children: 0, infants: 0 },
  onChange,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [passengers, setPassengers] = useState(value);
  const containerRef = useRef(null);

  // Generate passenger summary text
  const getPassengerSummary = () => {
    const { adults, children, infants } = passengers;
    const parts = [];

    if (adults > 0) {
      parts.push(`${adults} ${adults === 1 ? 'Adult' : 'Adults'}`);
    }
    if (children > 0) {
      parts.push(`${children} ${children === 1 ? 'Child' : 'Children'}`);
    }
    if (infants > 0) {
      parts.push(`${infants} ${infants === 1 ? 'Infant' : 'Infants'}`);
    }

    return parts.join(', ') || '0 Passengers';
  };

  // Handle increment/decrement
  const updatePassengers = (type, delta) => {
    const updated = { ...passengers };
    const newValue = Math.max(0, updated[type] + delta);

    // Ensure at least 1 adult
    if (type === 'adults' && newValue < 1) {
      return;
    }

    // Limit infants to number of adults (each infant must have an adult)
    if (type === 'infants' && newValue > updated.adults) {
      return;
    }

    updated[type] = newValue;
    setPassengers(updated);
    onChange?.(updated);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with external value changes
  useEffect(() => {
    setPassengers(value);
  }, [value]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center bg-[#1F1F1F] rounded-full p-3 cursor-pointer hover:bg-surface-bright transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <span className="material-symbols-outlined text-outline mr-3">person</span>
        <div className="flex-1 text-left">
          <span className="font-label-sm text-label-sm text-outline block mb-1">
            Passengers
          </span>
          <span className="text-primary font-body-md text-sm">
            {getPassengerSummary()}
          </span>
        </div>
        <span className="material-symbols-outlined text-outline text-[20px]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1F1F1F] rounded-lg border border-[#2C2C2C] shadow-lg z-50 p-3 w-full sm:w-72">
          {/* Adults */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-primary font-label-md">Adults</div>
              <div className="text-outline font-label-sm text-sm">
                12 years and older
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updatePassengers('adults', -1)}
                disabled={passengers.adults <= 1}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-[#2C2C2C] hover:bg-[#2C2C2C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
              <span className="w-7 text-center text-primary font-body-md font-bold">
                {passengers.adults}
              </span>
              <button
                onClick={() => updatePassengers('adults', 1)}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-[#2C2C2C] hover:bg-[#2C2C2C] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
          </div>

          {/* Children */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#2C2C2C]">
            <div>
              <div className="text-primary font-label-md">Children</div>
              <div className="text-outline font-label-sm text-sm">
                2 to 11 years
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updatePassengers('children', -1)}
                disabled={passengers.children <= 0}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-[#2C2C2C] hover:bg-[#2C2C2C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
              <span className="w-7 text-center text-primary font-body-md font-bold">
                {passengers.children}
              </span>
              <button
                onClick={() => updatePassengers('children', 1)}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-[#2C2C2C] hover:bg-[#2C2C2C] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
          </div>

          {/* Infants */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-primary font-label-md">Infants</div>
              <div className="text-outline font-label-sm text-sm">
                Under 2 years
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updatePassengers('infants', -1)}
                disabled={passengers.infants <= 0}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-[#2C2C2C] hover:bg-[#2C2C2C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
              <span className="w-7 text-center text-primary font-body-md font-bold">
                {passengers.infants}
              </span>
              <button
                onClick={() => updatePassengers('infants', 1)}
                disabled={passengers.infants >= passengers.adults}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-[#2C2C2C] hover:bg-[#2C2C2C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-3 p-2 bg-[#0e0e0e] rounded text-primary font-label-sm text-sm">
            Each infant must have an accompanying adult.
          </div>
        </div>
      )}
    </div>
  );
}
