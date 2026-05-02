// src/components/DatePickerDOB.jsx
// ---------------------------------------------------------------------------
// Compact date-picker for Date of Birth fields.
// Identical trigger/calendar size to DatePickerField but adds:
//   • Click month name  → 3×4 month grid
//   • Click year        → 4×3 year grid (12-year pages, no future years)
//   • Back arrow in month/year view navigates back to day grid
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef } from 'react';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_INITIALS = ['S','M','T','W','T','F','S'];

export default function DatePickerDOB({ value, onChange, error }) {
  const todayUTC = (() => {
    const t = new Date();
    return new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()));
  })();

  // ── helpers ──────────────────────────────────────────────────────────────
  const parseUTC = (str) => {
    if (!str) return null;
    const [y, m, d] = str.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  };
  const toStr = (date) => {
    if (!date) return null;
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const formatDisplay = (date) => {
    if (!date) return '';
    return `${MONTH_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  };

  // ── state ─────────────────────────────────────────────────────────────────
  const [isOpen,     setIsOpen]     = useState(false);
  const [viewMode,   setViewMode]   = useState('days'); // 'days' | 'months' | 'years'
  const [selected,   setSelected]   = useState(() => parseUTC(value));
  const [curMonth,   setCurMonth]   = useState(() => {
    const d = parseUTC(value) || new Date(Date.UTC(todayUTC.getUTCFullYear() - 25, 0, 1));
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  });
  const [yearStart,  setYearStart]  = useState(() => {
    const y = parseUTC(value)?.getUTCFullYear() ?? (todayUTC.getUTCFullYear() - 25);
    return Math.floor(y / 12) * 12;
  });
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setViewMode('days');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Sync external value
  useEffect(() => {
    const d = parseUTC(value);
    if (d?.getTime() !== selected?.getTime()) {
      setSelected(d);
      if (d) setCurMonth(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
    }
  }, [value]);

  // ── calendar helpers ──────────────────────────────────────────────────────
  const yr  = curMonth.getUTCFullYear();
  const mo  = curMonth.getUTCMonth();

  const calDays = () => {
    const firstDay  = new Date(Date.UTC(yr, mo, 1)).getUTCDay();
    const daysInMo  = new Date(Date.UTC(yr, mo + 1, 0)).getUTCDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMo; i++) days.push(new Date(Date.UTC(yr, mo, i)));
    return days;
  };

  const handleSelectDate = (date) => {
    if (!date || date > todayUTC) return;
    setSelected(date);
    onChange?.(toStr(date));
    setIsOpen(false);
    setViewMode('days');
  };

  const handleSelectMonth = (monthIdx) => {
    setCurMonth(new Date(Date.UTC(yr, monthIdx, 1)));
    setViewMode('days');
  };

  const handleSelectYear = (year) => {
    setCurMonth(new Date(Date.UTC(year, mo, 1)));
    setYearStart(Math.floor(year / 12) * 12);
    setViewMode('months');
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative">

      {/* Trigger — matches DatePickerField capsule style */}
      <div
        className={`flex items-center bg-[#1F1F1F] rounded-full h-12 px-5 cursor-pointer hover:bg-surface-bright transition-all ${
          error ? 'ring-2 ring-error-container' : ''
        }`}
        onClick={() => setIsOpen((o) => !o)}
      >
        <span className="material-symbols-outlined text-outline mr-3 text-[20px]">calendar_today</span>
        <div className="flex-1 text-sm font-body-md">
          {selected
            ? <span className="text-primary">{formatDisplay(selected)}</span>
            : <span className="text-[#8e9192]">Select date</span>
          }
        </div>
        <span className="material-symbols-outlined text-outline text-[20px]">expand_more</span>
      </div>

      {error && (
        <p className="text-error-container font-label-sm text-label-sm mt-1 px-2">{error}</p>
      )}

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-[#1F1F1F] rounded-xl border border-[#2C2C2C] shadow-xl z-50 p-3 w-64">

          {/* ── Day grid ── */}
          {viewMode === 'days' && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCurMonth(new Date(Date.UTC(yr, mo - 1, 1)))}
                  className="p-1.5 hover:bg-[#2C2C2C] rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-outline text-base leading-none">chevron_left</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode('months')}
                    className="text-primary font-label-md text-sm hover:text-white transition-colors px-1 rounded hover:bg-[#2C2C2C]"
                  >
                    {MONTH_SHORT[mo]}
                  </button>
                  <button
                    onClick={() => setViewMode('years')}
                    className="text-primary font-label-md text-sm hover:text-white transition-colors px-1 rounded hover:bg-[#2C2C2C]"
                  >
                    {yr}
                  </button>
                </div>
                <button
                  onClick={() => setCurMonth(new Date(Date.UTC(yr, mo + 1, 1)))}
                  disabled={new Date(Date.UTC(yr, mo + 1, 1)) > todayUTC}
                  className="p-1.5 hover:bg-[#2C2C2C] rounded-full transition-colors disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-outline text-base leading-none">chevron_right</span>
                </button>
              </div>

              {/* Day initials */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAY_INITIALS.map((d, i) => (
                  <div key={i} className="text-center text-outline text-xs h-6 flex items-center justify-center">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {calDays().map((date, i) => {
                  const isFuture = date && date > todayUTC;
                  const isSel    = date && selected &&
                    date.getUTCFullYear() === selected.getUTCFullYear() &&
                    date.getUTCMonth()    === selected.getUTCMonth() &&
                    date.getUTCDate()     === selected.getUTCDate();
                  return (
                    <button
                      key={i}
                      onClick={() => date && handleSelectDate(date)}
                      disabled={!date || isFuture}
                      className={`
                        h-7 rounded text-xs font-body-md transition-colors
                        ${!date || isFuture ? 'opacity-25 cursor-not-allowed' : ''}
                        ${isSel  ? 'bg-white text-black font-bold' : ''}
                        ${!isSel && date && !isFuture ? 'text-primary hover:bg-[#2C2C2C]' : ''}
                      `}
                    >
                      {date?.getUTCDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Month grid ── */}
          {viewMode === 'months' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCurMonth(new Date(Date.UTC(yr - 1, mo, 1)))}
                  className="p-1.5 hover:bg-[#2C2C2C] rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-outline text-base leading-none">chevron_left</span>
                </button>
                <button
                  onClick={() => setViewMode('years')}
                  className="text-primary font-label-md text-sm hover:text-white transition-colors px-2 rounded hover:bg-[#2C2C2C]"
                >
                  {yr}
                </button>
                <button
                  onClick={() => setCurMonth(new Date(Date.UTC(yr + 1, mo, 1)))}
                  disabled={yr + 1 > todayUTC.getUTCFullYear()}
                  className="p-1.5 hover:bg-[#2C2C2C] rounded-full transition-colors disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-outline text-base leading-none">chevron_right</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {MONTH_SHORT.map((m, i) => {
                  const isFutureMo = yr === todayUTC.getUTCFullYear() && i > todayUTC.getUTCMonth();
                  return (
                    <button
                      key={i}
                      onClick={() => !isFutureMo && handleSelectMonth(i)}
                      disabled={isFutureMo}
                      className={`
                        py-2 rounded-full text-xs font-label-md transition-colors
                        ${mo === i ? 'bg-white text-black font-bold' : ''}
                        ${!isFutureMo && mo !== i ? 'text-primary hover:bg-[#2C2C2C]' : ''}
                        ${isFutureMo ? 'opacity-25 cursor-not-allowed' : ''}
                      `}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Year grid ── */}
          {viewMode === 'years' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setYearStart((s) => s - 12)}
                  className="p-1.5 hover:bg-[#2C2C2C] rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-outline text-base leading-none">chevron_left</span>
                </button>
                <span className="text-outline font-label-sm text-xs">
                  {yearStart} – {yearStart + 11}
                </span>
                <button
                  onClick={() => setYearStart((s) => s + 12)}
                  disabled={yearStart + 12 > todayUTC.getUTCFullYear()}
                  className="p-1.5 hover:bg-[#2C2C2C] rounded-full transition-colors disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-outline text-base leading-none">chevron_right</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 12 }, (_, i) => yearStart + i).map((year) => {
                  const isFutureYr = year > todayUTC.getUTCFullYear();
                  return (
                    <button
                      key={year}
                      onClick={() => !isFutureYr && handleSelectYear(year)}
                      disabled={isFutureYr}
                      className={`
                        py-2 rounded-full text-xs font-label-md transition-colors
                        ${yr === year ? 'bg-white text-black font-bold' : ''}
                        ${!isFutureYr && yr !== year ? 'text-primary hover:bg-[#2C2C2C]' : ''}
                        ${isFutureYr ? 'opacity-25 cursor-not-allowed' : ''}
                      `}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
