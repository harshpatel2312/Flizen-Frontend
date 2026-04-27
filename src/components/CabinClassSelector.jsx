import { useState, useRef, useEffect } from 'react';

const CABIN_CLASSES = [
  {
    id: 'economy',
    name: 'Economy',
    description: 'Standard seating',
    icon: 'event_seat',
  },
  {
    id: 'premium-economy',
    name: 'Premium Economy',
    description: 'Extra legroom',
    icon: 'airline_seat_legroom_extra',
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Flat bed seats',
    icon: 'airline_seat_flat',
  },
  {
    id: 'first',
    name: 'First',
    description: 'Premium experience',
    icon: 'airline_seat_individual_suite',
  },
];

export default function CabinClassSelector({
  value = 'Economy',
  onChange,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(value);
  const containerRef = useRef(null);

  // Get cabin class name from ID or vice versa
  const getCabinClass = (val) => {
    const cabin = CABIN_CLASSES.find(
      (c) => c.id === val || c.name === val
    );
    return cabin?.name || val;
  };

  const getCabinId = (val) => {
    const cabin = CABIN_CLASSES.find(
      (c) => c.id === val || c.name === val
    );
    return cabin?.id || val;
  };

  // Handle selection
  const handleSelect = (cabinClass) => {
    setSelected(cabinClass.name);
    onChange?.(cabinClass.name);
    setIsOpen(false);
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
    setSelected(getCabinClass(value));
  }, [value]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center bg-[#1F1F1F] rounded-lg p-3 cursor-pointer hover:bg-surface-bright transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <span className="material-symbols-outlined text-outline mr-3">
          airline_seat_recline_extra
        </span>
        <div className="flex-1 text-left">
          <span className="font-label-sm text-label-sm text-outline block mb-1">
            Class
          </span>
          <span className="text-primary font-body-md text-sm">{selected}</span>
        </div>
        <span className="material-symbols-outlined text-outline text-[20px]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1F1F1F] rounded-lg border border-[#2C2C2C] shadow-lg z-50 p-2 w-full sm:w-80">
          {CABIN_CLASSES.map((cabin) => (
            <button
              key={cabin.id}
              onClick={() => handleSelect(cabin)}
              className={`
                w-full p-3 rounded-lg mb-2 last:mb-0 text-left transition-colors
                ${selected === cabin.name
                  ? 'bg-secondary-container border border-secondary'
                  : 'hover:bg-[#2C2C2C] border border-[#2C2C2C]'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <span className={`
                  material-symbols-outlined mt-0.5 flex-shrink-0
                  ${selected === cabin.name ? 'text-on-secondary-container' : 'text-secondary-container'}
                `}>
                  {cabin.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`
                    font-label-md
                    ${selected === cabin.name ? 'text-on-secondary-container' : 'text-primary'}
                  `}>
                    {cabin.name}
                  </div>
                  <div className={`
                    font-label-sm text-sm
                    ${selected === cabin.name ? 'text-on-secondary-container opacity-80' : 'text-outline'}
                  `}>
                    {cabin.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
