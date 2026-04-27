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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const containerRef = useRef(null);

  // Format date for display
  const formatDateDisplay = (date) => {
    if (!date) return '';
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (
      date.toDateString() === today.toDateString()
    ) {
      return 'Today';
    }
    if (
      date.toDateString() === tomorrow.toDateString()
    ) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Format date for API (YYYY-MM-DD)
  const formatDateAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Get calendar days
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }

    return days;
  };

  // Check if date is disabled
  const isDateDisabled = (date) => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      return true;
    }

    // Disable dates after max date
    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(23, 59, 59, 999);
      if (date > max) {
        return true;
      }
    }

    return false;
  };

  // Handle date selection
  const handleSelectDate = (date) => {
    if (isDateDisabled(date)) return;

    setSelectedDate(date);
    onChange?.(formatDateAPI(date));
    setIsOpen(false);
  };

  // Handle month navigation
  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
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
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [value]);

  const calendarDays = generateCalendarDays();
  const monthYear = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div ref={containerRef} className="relative">
      {/* Input Field */}
      <div
        className={`flex items-center bg-[#1F1F1F] rounded-lg p-3 group focus-within:ring-1 transition-all cursor-pointer ${
          error
            ? 'ring-1 ring-error-container border border-error-container'
            : 'focus-within:ring-secondary-container'
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
        <div className="absolute top-full left-0 mt-2 bg-[#1F1F1F] rounded-lg border border-[#2C2C2C] shadow-lg z-50 p-4 w-72">
          {/* Month/Year Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-[#2C2C2C] rounded transition-colors"
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
              className="p-2 hover:bg-[#2C2C2C] rounded transition-colors"
            >
              <span className="material-symbols-outlined text-outline">
                chevron_right
              </span>
            </button>
          </div>

          {/* Day of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-outline-variant font-label-sm text-label-sm h-8"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, i) => {
              const isDisabled = date && isDateDisabled(date);
              const isSelected =
                date &&
                selectedDate &&
                date.toDateString() === selectedDate.toDateString();
              const isToday =
                date &&
                date.toDateString() === new Date().toDateString();

              return (
                <button
                  key={i}
                  onClick={() => date && handleSelectDate(date)}
                  disabled={isDisabled}
                  className={`
                    h-8 rounded text-sm font-body-md transition-colors
                    ${!date ? '' : ''}
                    ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}
                    ${isSelected ? 'bg-secondary-container text-on-secondary-container font-bold' : ''}
                    ${isToday && !isSelected ? 'ring-1 ring-secondary text-secondary' : ''}
                    ${!isSelected && !isDisabled && !isToday ? 'text-primary hover:bg-[#2C2C2C]' : ''}
                  `}
                >
                  {date ? date.getDate() : ''}
                </button>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="border-t border-[#2C2C2C] mt-4 pt-4 flex gap-2">
            <button
              onClick={() => {
                const today = new Date();
                handleSelectDate(today);
              }}
              className="flex-1 py-2 px-3 text-sm text-primary hover:bg-[#2C2C2C] rounded transition-colors font-label-md"
            >
              Today
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                handleSelectDate(tomorrow);
              }}
              className="flex-1 py-2 px-3 text-sm text-primary hover:bg-[#2C2C2C] rounded transition-colors font-label-md"
            >
              Tomorrow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
