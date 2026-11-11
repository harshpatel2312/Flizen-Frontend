// src/components/SearchableDropdown.jsx
// ---------------------------------------------------------------------------
// Capsule-style dropdown with a search box (same look as the page dropdowns).
// `options` may be strings or { value, label } objects.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/AirportAutocomplete.css';

export default function SearchableDropdown({
  label,
  error,
  options,
  placeholder,
  value,
  onChange,
  searchPlaceholder = 'Search',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  const items = useMemo(
    () => options.map((o) => ({ value: o.value ?? o, label: o.label ?? o })),
    [options],
  );

  const close = () => {
    setIsOpen(false);
    setQuery('');
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    searchRef.current?.focus();
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Names starting with the query first, then word matches, then the rest.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    const rank = (lbl) => {
      const l = lbl.toLowerCase();
      if (l === q) return 0;
      if (l.startsWith(q)) return 1;
      if (l.split(/[\s(-]+/).some((w) => w.startsWith(q))) return 2;
      return 3;
    };
    return items
      .filter((i) => String(i.label).toLowerCase().includes(q))
      .map((i) => ({ i, r: rank(String(i.label)) }))
      .sort((a, b) => a.r - b.r)
      .map(({ i }) => i);
  }, [items, query]);

  const select = (val) => {
    onChange(val);
    close();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'Enter' && filtered[0]) {
      e.preventDefault();
      select(filtered[0].value);
    }
  };

  const selected = items.find((i) => i.value === value);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-label-sm text-label-sm text-outline uppercase tracking-widest">{label}</label>
      )}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => (isOpen ? close() : setIsOpen(true))}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full flex items-center bg-[#1F1F1F] rounded-full h-12 px-5 cursor-pointer hover:bg-surface-bright transition-all text-left
            ${error ? 'ring-2 ring-error-container' : isOpen ? 'ring-2 ring-white' : ''}`}
        >
          <span className={`flex-1 truncate font-body-md text-sm ${selected ? 'text-primary' : 'text-[#8e9192]'}`}>
            {selected ? selected.label : placeholder}
          </span>
          <span className="material-symbols-outlined text-outline text-[20px]">expand_more</span>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1F1F1F] rounded-lg border border-[#2C2C2C] shadow-xl z-50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 border-b border-[#2C2C2C]">
              <span className="material-symbols-outlined text-outline text-[18px]">search</span>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent h-11 text-primary font-body-md text-sm focus:outline-none placeholder:text-[#8e9192]"
              />
            </div>
            <ul role="listbox" className="airport-dropdown max-h-60 overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-4 py-3 font-body-md text-sm text-outline">No matches</li>
              )}
              {filtered.map((item) => {
                const isSelected = item.value === value;
                return (
                  <li key={item.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => select(item.value)}
                      className={`group w-full flex items-center px-4 py-3 text-left hover:bg-[#2C2C2C] transition-colors border-b border-[#2C2C2C] last:border-b-0 font-body-md text-primary ${isSelected ? 'bg-[#262626]' : ''}`}
                    >
                      <span className="flex-1 group-hover:text-secondary transition-colors">{item.label}</span>
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
