import { useState } from 'react';

export default function FlightFilters({ onSortChange, onFilterClick }) {
  const [activeSort, setActiveSort] = useState('best');

  const sorts = [
    { id: 'best', label: 'Best' },
    { id: 'cheapest', label: 'Cheapest' },
    { id: 'fastest', label: 'Fastest' },
  ];

  const handleSort = (sortId) => {
    setActiveSort(sortId);
    onSortChange?.(sortId);
  };

  return (
    <section className="flex justify-between items-center mb-6 overflow-x-auto pb-2">
      <div className="flex gap-2">
        {sorts.map((sort) => (
          <button
            key={sort.id}
            onClick={() => handleSort(sort.id)}
            className={`font-label-md text-label-md px-4 py-2 rounded-full transition-colors ${
              activeSort === sort.id
                ? 'bg-[#1F1F1F] text-primary border border-primary'
                : 'bg-[#121212] text-on-surface-variant hover:bg-surface-variant border border-[#2C2C2C]'
            }`}
          >
            {sort.label}
          </button>
        ))}
      </div>
      <button
        onClick={onFilterClick}
        className="bg-[#121212] flex items-center gap-2 px-4 py-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface border border-[#2C2C2C]"
      >
        <span className="material-symbols-outlined text-sm">tune</span>
        <span className="font-label-md text-label-md">Filter</span>
      </button>
    </section>
  );
}
