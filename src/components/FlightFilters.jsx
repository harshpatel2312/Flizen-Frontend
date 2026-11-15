import { pillClass } from '../utils/pillStyles';

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

  const pill = (active) => pillClass(active);

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
        className={pillClass(activeFilterCount > 0, 'flex items-center gap-1.5 flex-shrink-0')}
      >
        <span className="material-symbols-outlined text-[18px]">tune</span>
        {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filter'}
      </button>
    </div>
  );
}
