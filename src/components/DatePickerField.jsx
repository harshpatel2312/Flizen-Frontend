import { useState, useEffect, useRef } from 'react';

export default function DatePickerField({
  label,
  icon,
  value,
  onChange,
  minDate = new Date(),
  maxDate = null,
  disabled = false,
  error = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Helper: Convert YYYY-MM-DD string to UTC Date object
  const parseUTCDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };
  
  // Helper: Convert UTC Date to YYYY-MM-DD string
  const dateToString = (date) => {
    if (!date) return null;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [selectedDate, setSelectedDate] = useState(() => {
    return value ? parseUTCDate(value) : null;
  });
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    let date;
    if (value) {
      date = parseUTCDate(value);
    } else {
      date = new Date();
      date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  });
  const containerRef = useRef(null);

  const MONTH_NAMES_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Format date for display (using UTC Date object)
  const formatDateDisplay = (date) => {
    if (!date) return '';
    
    const month = MONTH_NAMES_SHORT[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    
    const today = new Date();
    const currentYear = today.getUTCFullYear();
    
    return `${month} ${day}${year !== currentYear ? ', ' + year : ''}`;
  };
  
  // Format date for API (YYYY-MM-DD) from UTC Date
  const formatDateAPI = (date) => {
    return dateToString(date);
  };

  // Get calendar days (using UTC)
  const getDaysInMonth = (date) => {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).getUTCDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of month as UTC Date objects
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), i)));
    }

    return days;
  };

  // Accepts a Date, a YYYY-MM-DD string, or null and returns a UTC-midnight Date.
  const toUTCMidnight = (input) => {
    if (!input) return null;
    if (typeof input === 'string') return parseUTCDate(input);
    if (input instanceof Date) {
      return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
    }
    return null;
  };

  // Check if date is disabled (date is UTC Date object)
  const isDateDisabled = (date) => {
    if (!date) return false;

    // Get today as UTC at midnight
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    // Effective lower bound = later of (today, minDate)
    const minBound = toUTCMidnight(minDate);
    const lowerBound = minBound && minBound > todayUTC ? minBound : todayUTC;

    if (date < lowerBound) {
      return true;
    }

    // Check max date
    if (maxDate) {
      const maxDateObj = toUTCMidnight(maxDate);
      if (maxDateObj && date > maxDateObj) {
        return true;
      }
    }

    return false;
  };

  // Handle date selection (receives UTC Date object)
  const handleSelectDate = (date) => {
    if (isDateDisabled(date)) return;

    setSelectedDate(date);
    onChange?.(formatDateAPI(date));
    setIsOpen(false);
  };

  // Handle month navigation (using UTC)
  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 1, 1))
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + 1, 1))
    );
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

  // Sync selected date when value prop changes
  useEffect(() => {
    const newSelectedDate = parseUTCDate(value);
    // Only update if the value actually changed
    if (newSelectedDate?.getTime?.() !== selectedDate?.getTime?.()) {
      setSelectedDate(newSelectedDate);
      if (newSelectedDate) {
        setCurrentMonth(new Date(Date.UTC(newSelectedDate.getUTCFullYear(), newSelectedDate.getUTCMonth(), 1)));
      }
    }
  }, [value]);

  const calendarDays = generateCalendarDays();
  const monthYear = `${MONTH_NAMES_FULL[currentMonth.getUTCMonth()]} ${currentMonth.getUTCFullYear()}`;

  return (
    <div ref={containerRef} className="relative">
      {/* Input Field */}
      <div
        className={`flex items-center bg-[#1F1F1F] rounded-full p-3 group focus-within:ring-2 transition-all cursor-pointer ${
          error
            ? 'ring-2 ring-error-container border border-error-container'
            : 'focus-within:ring-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="material-symbols-outlined text-outline mr-3">{icon}</span>
        <div className="flex-1">
          <label className="font-label-sm text-label-sm text-outline block mb-1">
            {label}
          </label>
          <div className="text-primary font-body-md">
            {selectedDate ? formatDateDisplay(selectedDate) : 'Add date'}
          </div>
        </div>
        <span className="material-symbols-outlined text-outline">expand_more</span>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-error-container font-label-sm text-label-sm mt-2">
          {error}
        </div>
      )}

      {/* Calendar Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 bg-[#1F1F1F] rounded-lg border border-[#2C2C2C] shadow-lg z-50 p-3 w-64">
          {/* Month/Year Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-[#2C2C2C] rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-outline">
                chevron_left
              </span>
            </button>
            <div className="text-primary font-headline-md text-center flex-1">
              {monthYear}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-[#2C2C2C] rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-outline">
                chevron_right
              </span>
            </button>
          </div>

          {/* Day of week header */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-outline-variant font-label-sm text-label-sm h-6 text-xs"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((date, i) => {
              const isDisabled = date && isDateDisabled(date);
              
              // Compare UTC dates
              const isSelected =
                date &&
                selectedDate &&
                date.getUTCFullYear() === selectedDate.getUTCFullYear() &&
                date.getUTCMonth() === selectedDate.getUTCMonth() &&
                date.getUTCDate() === selectedDate.getUTCDate();
              
              return (
                <button
                  key={i}
                  onClick={() => date && handleSelectDate(date)}
                  disabled={isDisabled}
                  className={`
                    h-7 rounded text-xs font-body-md transition-colors
                    ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}
                    ${isSelected ? 'bg-white text-black font-bold' : ''}
                    ${!isSelected && !isDisabled ? 'text-primary hover:bg-[#2C2C2C]' : ''}
                  `}
                >
                  {date && date.getUTCDate()}
                </button>
              );
            })}
          </div>


        </div>
      )}
    </div>
  );
}
