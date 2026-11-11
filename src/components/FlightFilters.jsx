export default function FlightFilters({ value = 'best', onSortChange, onFilterOpen, activeFilterCount = 0 }) {
  // Controlled by the parent so restored / reset sorts are reflected here.
  const activeSort = value;

  const sorts = [
    { id: 'best',     label: 'Best'     },
    { id: 'cheapest', label: 'Cheapest' },
    { id: 'fastest',  label: 'Fastest'  },
  ];

  const handleSort = (sortId) => {
    onSortChange?.(sortId);
  };

  const pill = (active) =>
    `font-label-md text-label-md px-4 py-2 rounded-full transition-colors border whitespace-nowrap ${
      active
        ? 'bg-[#1F1F1F] text-primary border-primary'
        : 'bg-[#121212] text-on-surface-variant hover:bg-surface-variant border-[#2C2C2C]'
    }`;

  return (
    <div className="flex items-center justify-between mb-6 gap-4">
      {/* Sort pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sorts.map((sort) => (
          <button key={sort.id} onClick={() => handleSort(sort.id)} className={pill(activeSort === sort.id)}>
            {sort.label}
          </button>
        ))}
      </div>

      {/* Filter button */}
      <button
        onClick={onFilterOpen}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-label-md text-label-md border transition-all whitespace-nowrap flex-shrink-0 ${
          activeFilterCount > 0
            ? 'bg-[#1F1F1F] text-primary border-primary'
            : 'bg-[#121212] text-on-surface-variant border-[#2C2C2C] hover:border-outline'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">tune</span>
        {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filter'}
      </button>
    </div>
  );
}
