// src/components/PhoneInput.jsx
// ---------------------------------------------------------------------------
// Phone field with a searchable country-code picker (flag, name, dial code).
// The number box formats as you type in the selected country's style.
// `value` / `onChange` use E.164 strings, e.g. "+15483333136".
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PHONE_COUNTRIES,
  buildPhoneValue,
  defaultPhoneCountry,
  parsePhoneValue,
  phonePlaceholder,
} from '../utils/phone';
import '../styles/AirportAutocomplete.css';

const FLAG_FILES = import.meta.glob('../../node_modules/country-flag-icons/3x2/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});
const flagUrl = (iso) => FLAG_FILES[`../../node_modules/country-flag-icons/3x2/${iso}.svg`];
const COUNTRY_BY_ISO = Object.fromEntries(PHONE_COUNTRIES.map((c) => [c.iso, c]));

function Flag({ iso, className = '' }) {
  const src = flagUrl(iso);
  if (!src) {
    return <span className={`material-symbols-outlined text-[18px] text-outline ${className}`}>public</span>;
  }
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={`w-6 h-4 rounded-[3px] object-cover flex-shrink-0 ${className}`}
    />
  );
}

export default function PhoneInput({ label = 'Phone Number', value, onChange, onBlur, error }) {
  const [state, setState] = useState(() => ({
    ...parsePhoneValue(value, defaultPhoneCountry()),
    value: value || '',
  }));
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const numberRef = useRef(null);
  const searchRef = useRef(null);

  // Re-sync when the parent sets the value (profile load, restored form, etc.).
  if ((value || '') !== state.value) {
    setState({ ...parsePhoneValue(value, state.country), value: value || '' });
  }

  useEffect(() => {
    if (!isOpen) return undefined;
    const onMouseDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    searchRef.current?.focus();
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '');
    if (!q) return PHONE_COUNTRIES;
    // Rank: exact name/ISO/code, then names starting with the query, then the rest.
    const rank = (c) => {
      const name = c.name.toLowerCase();
      if (name === q || c.iso.toLowerCase() === q || c.code === q) return 0;
      if (name.startsWith(q)) return 1;
      if (name.split(/[\s(-]+/).some((w) => w.startsWith(q))) return 2;
      return 3;
    };
    return PHONE_COUNTRIES
      .filter((c) => c.name.toLowerCase().includes(q) || c.iso.toLowerCase() === q || c.code.startsWith(q))
      .map((c) => ({ c, r: rank(c) }))
      .sort((a, b) => a.r - b.r)
      .map(({ c }) => c);
  }, [query]);

  const emit = (country, display, nextValue) => {
    setState({ country, national: display, value: nextValue });
    onChange(nextValue);
  };

  const handleNumberChange = (e) => {
    const raw = e.target.value;
    // Pasting a full international number switches the country automatically.
    if (raw.trim().startsWith('+')) {
      const parsed = parsePhoneValue(raw, state.country);
      const { display, value: next } = buildPhoneValue(parsed.country, parsed.national);
      emit(parsed.country, display, next);
      return;
    }
    const { display, value: next } = buildPhoneValue(state.country, raw, state.national);
    emit(state.country, display, next);
  };

  const selectCountry = (iso) => {
    const { display, value: next } = buildPhoneValue(iso, state.national);
    emit(iso, display, next);
    setIsOpen(false);
    setQuery('');
    numberRef.current?.focus();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    } else if (e.key === 'Enter' && filtered[0]) {
      e.preventDefault();
      selectCountry(filtered[0].iso);
    }
  };

  const selected = COUNTRY_BY_ISO[state.country];

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-label-sm text-label-sm text-outline uppercase tracking-widest">{label}</label>
      )}
      <div ref={wrapperRef} className="relative">
        <div
          className={`flex items-center bg-[#1F1F1F] rounded-full h-12 focus-within:ring-2 transition-all
            ${error ? 'ring-2 ring-error-container' : isOpen ? 'ring-2 ring-white' : 'focus-within:ring-white'}`}
        >
          <button
            type="button"
            onClick={() => setIsOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label={`Country code: ${selected?.name ?? state.country} +${selected?.code ?? ''}`}
            className="flex items-center gap-2 h-full pl-5 pr-3 rounded-l-full hover:bg-surface-bright transition-colors flex-shrink-0"
          >
            <Flag iso={state.country} />
            <span className="font-body-md text-primary tabular-nums">+{selected?.code}</span>
            <span className="material-symbols-outlined text-outline text-[18px] -ml-1">expand_more</span>
          </button>
          <div className="w-px h-6 bg-[#3A3A3A] flex-shrink-0" aria-hidden="true" />
          <input
            ref={numberRef}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            className="flex-1 min-w-0 bg-transparent h-full pl-3 pr-5 text-primary font-body-md focus:outline-none placeholder:text-[#8e9192]"
            placeholder={phonePlaceholder(state.country)}
            value={state.national}
            onChange={handleNumberChange}
            onBlur={onBlur}
          />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1F1F1F] rounded-lg border border-[#2C2C2C] shadow-xl z-50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 border-b border-[#2C2C2C]">
              <span className="material-symbols-outlined text-outline text-[18px]">search</span>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search country or code"
                className="flex-1 bg-transparent h-11 text-primary font-body-md text-sm focus:outline-none placeholder:text-[#8e9192]"
              />
            </div>
            <ul role="listbox" className="airport-dropdown max-h-64 overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-4 py-3 font-body-md text-sm text-outline">No matching countries</li>
              )}
              {filtered.map((c) => {
                const isSelected = c.iso === state.country;
                return (
                  <li key={c.iso} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => selectCountry(c.iso)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#2C2C2C] ${isSelected ? 'bg-[#262626]' : ''}`}
                    >
                      <Flag iso={c.iso} />
                      <span className="flex-1 min-w-0 truncate font-body-md text-sm text-primary">{c.name}</span>
                      <span className="font-body-md text-sm text-outline tabular-nums">+{c.code}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="text-error-container font-label-sm text-label-sm px-2">{error}</p>}
    </div>
  );
}
