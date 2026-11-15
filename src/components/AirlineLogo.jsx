// src/components/AirlineLogo.jsx
// Airline logo with fallbacks: the stored logo URL, then Duffel's logo CDN by
// IATA code, then a plane icon. The logo is shown on its own, without a backdrop.

import { useState } from 'react';

const duffelLogoUrl = (code) =>
  `https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/${encodeURIComponent(code)}.svg`;

export default function AirlineLogo({ src, iataCode, name, className = 'w-10 h-10' }) {
  const sources = [...new Set([src, iataCode && duffelLogoUrl(iataCode)].filter(Boolean))];
  const sourcesKey = sources.join('|');
  // Keyed by the source list so a different airline starts from its first source again.
  const [failed, setFailed] = useState({ key: sourcesKey, count: 0 });
  const index = failed.key === sourcesKey ? failed.count : 0;
  const current = sources[index];

  if (!current) {
    return (
      <span
        className={`${className} rounded-full bg-surface-container-high flex items-center justify-center shrink-0`}
        aria-hidden="true"
      >
        <span className="material-symbols-outlined text-primary text-[18px]">flight</span>
      </span>
    );
  }

  return (
    <img
      key={current}
      src={current}
      alt={name ? `${name} logo` : ''}
      loading="lazy"
      className={`${className} object-contain shrink-0`}
      onError={() => setFailed({ key: sourcesKey, count: index + 1 })}
    />
  );
}
