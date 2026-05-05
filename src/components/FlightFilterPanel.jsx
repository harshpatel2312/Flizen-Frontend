import { useState, useEffect } from 'react';

export const STOPS_OPTIONS = [
  { id: 'non-stop', label: 'Non-stop', value: 0 },
  { id: '1-stop',   label: '1 Stop',   value: 1 },
  { id: '2-plus',   label: '2+ Stops', value: 2 },
];

export const TIME_SLOTS = [
  { id: 'early',     label: 'Early Morning', sub: '00:00 – 08:00', start: 0,  end: 8  },
  { id: 'morning',   label: 'Morning',       sub: '08:00 – 12:00', start: 8,  end: 12 },
  { id: 'afternoon', label: 'Afternoon',     sub: '12:00 – 18:00', start: 12, end: 18 },
  { id: 'evening',   label: 'Evening',       sub: '18:00 – 00:00', start: 18, end: 24 },
];

export const DURATION_OPTIONS = [
  { id: 'under-6',  label: 'Under 6h'  },
  { id: '6-12',     label: '6h – 12h'  },
  { id: '12-plus',  label: '12h+'      },
];

export const DEFAULT_FILTERS = {
  stops: [],
  priceMax: null,
  airlines: [],
  timeSlots: [],
  duration: null,
};

function SectionHeader({ icon, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px] text-outline">{icon}</span>
      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function FlightFilterPanel({ isOpen, onClose, allFlights = [], filters, onApply }) {
  const [local, setLocal] = useState(filters ?? DEFAULT_FILTERS);

  // Sync local state every time the panel opens
  useEffect(() => {
    if (isOpen) setLocal(filters ?? DEFAULT_FILTERS);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive data-driven options
  const availableAirlines = [...new Set(allFlights.map((f) => f.airline).filter(Boolean))].sort();
  const prices = allFlights.map((f) => parseFloat(f.price)).filter((n) => !isNaN(n) && n > 0);
  const dataMin = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const dataMax = prices.length ? Math.ceil(Math.max(...prices)) : 5000;
  const currency = allFlights[0]?.currency || '';

  const fmt = (n) =>
    n.toLocaleString('en-US', { maximumFractionDigits: 0 }) + (currency ? ` ${currency}` : '');

  const sliderValue = local.priceMax ?? dataMax;

  // Toggles
  const toggleStop = (value) =>
    setLocal((p) => ({
      ...p,
      stops: p.stops.includes(value) ? p.stops.filter((s) => s !== value) : [...p.stops, value],
    }));

  const toggleAirline = (airline) =>
    setLocal((p) => ({
      ...p,
      airlines: p.airlines.includes(airline) ? p.airlines.filter((a) => a !== airline) : [...p.airlines, airline],
    }));

  const toggleTimeSlot = (id) =>
    setLocal((p) => ({
      ...p,
      timeSlots: p.timeSlots.includes(id) ? p.timeSlots.filter((s) => s !== id) : [...p.timeSlots, id],
    }));

  const toggleDuration = (id) =>
    setLocal((p) => ({ ...p, duration: p.duration === id ? null : id }));

  const handleReset = () => {
    setLocal(DEFAULT_FILTERS);
    onApply(DEFAULT_FILTERS);
    onClose();
  };

  const handleApply = () => {
    onApply({
      ...local,
      // slider at data max == no filter
      priceMax: local.priceMax != null && local.priceMax < dataMax ? local.priceMax : null,
    });
    onClose();
  };

  const pill = (active) =>
    `px-4 py-2 rounded-full font-label-md text-label-md transition-all border ${
      active
        ? 'bg-primary text-on-primary border-primary'
        : 'bg-transparent text-on-surface-variant border-[#2C2C2C] hover:border-outline'
    }`;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sliding panel */}
      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-[380px] bg-[#121212] border-l border-[#2C2C2C] flex flex-col shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2C2C2C]">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary">Filters</h2>
            <p className="font-label-md text-label-md text-on-surface-variant">Refine your results</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#1F1F1F] transition-all"
          >
            <span className="material-symbols-outlined text-primary">close</span>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 pb-36">

          {/* Stops */}
          <section>
            <SectionHeader icon="connecting_airports" label="Stops" />
            <div className="flex flex-wrap gap-2 mt-4">
              {STOPS_OPTIONS.map((opt) => (
                <button key={opt.id} onClick={() => toggleStop(opt.value)} className={pill(local.stops.includes(opt.value))}>
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Max Price */}
          {prices.length > 0 && (
            <section>
              <div className="flex items-center justify-between">
                <SectionHeader icon="payments" label="Max Price" />
                <span className="font-label-md text-label-md text-on-surface-variant">
                  {local.priceMax != null ? `≤ ${fmt(local.priceMax)}` : 'Any'}
                </span>
              </div>
              <div className="mt-5">
                <div className="relative w-full">
                  <input
                    type="range"
                    min={dataMin}
                    max={dataMax}
                    step={1}
                    value={sliderValue}
                    onChange={(e) => setLocal((p) => ({ ...p, priceMax: parseInt(e.target.value) }))}
                    className="w-full h-1 accent-white cursor-pointer"
                  />
                </div>
                <div className="flex justify-between font-label-sm text-label-sm text-outline mt-2">
                  <span>{fmt(dataMin)}</span>
                  <span>{fmt(dataMax)}</span>
                </div>
              </div>
            </section>
          )}

          {/* Airlines */}
          {availableAirlines.length > 1 && (
            <section>
              <SectionHeader icon="flight" label="Airlines" />
              <div className="mt-4 space-y-3">
                {availableAirlines.map((airline) => {
                  const checked = local.airlines.includes(airline);
                  return (
                    <label
                      key={airline}
                      onClick={() => toggleAirline(airline)}
                      className="flex items-center justify-between cursor-pointer group"
                    >
                      <span
                        className={`font-body-md transition-colors ${
                          checked ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'
                        }`}
                      >
                        {airline}
                      </span>
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          checked ? 'bg-primary border-primary' : 'border-[#2C2C2C]'
                        }`}
                      >
                        {checked && (
                          <span className="material-symbols-outlined text-on-primary" style={{ fontSize: 12 }}>check</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          {/* Departure Time */}
          <section>
            <SectionHeader icon="schedule" label="Departure Time" />
            <div className="grid grid-cols-2 gap-2 mt-4">
              {TIME_SLOTS.map((slot) => {
                const active = local.timeSlots.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    onClick={() => toggleTimeSlot(slot.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      active ? 'border-primary bg-[#1F1F1F]' : 'border-[#2C2C2C] hover:border-outline'
                    }`}
                  >
                    <p className={`font-label-md ${active ? 'text-primary' : 'text-on-surface-variant'}`}>{slot.label}</p>
                    <p className="text-[10px] text-outline mt-0.5">{slot.sub}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Duration */}
          <section>
            <SectionHeader icon="timer" label="Duration" />
            <div className="mt-4 space-y-3">
              {DURATION_OPTIONS.map((opt) => {
                const active = local.duration === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleDuration(opt.id)}
                    className="flex items-center gap-3 w-full text-left"
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        active ? 'border-primary' : 'border-[#2C2C2C]'
                      }`}
                    >
                      {active && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    </div>
                    <span className={`font-body-md ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-5 bg-[#121212] border-t border-[#2C2C2C] flex items-center gap-4">
          <button
            onClick={handleReset}
            className="flex-1 py-3.5 text-on-surface-variant font-label-md hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-[2] py-3.5 bg-primary text-on-primary font-label-md rounded-full hover:opacity-90 transition-all active:scale-95"
          >
            Apply Filters
          </button>
        </div>
      </aside>
    </>
  );
}
