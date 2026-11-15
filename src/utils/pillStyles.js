// Shared filter / sort pill style: selected pills are solid white with black text.
export function pillClass(active, extra = '') {
  return `font-label-md text-label-md px-4 py-2 rounded-full transition-colors border whitespace-nowrap ${extra} ${
    active
      ? 'bg-white text-black border-white'
      : 'bg-[#121212] text-on-surface-variant hover:bg-surface-variant border-[#2C2C2C]'
  }`;
}
