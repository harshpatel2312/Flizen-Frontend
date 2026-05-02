// src/services/flightCache.js
// ---------------------------------------------------------------------------
// Module-level in-memory cache for flight search results.
// Lives as long as the browser tab is open; cleared on tab close or explicit
// invalidation (home navigation, new search, completed booking).
// Key: URL search-params string (e.g. "origin=YYZ&destination=AMD&...")
// ---------------------------------------------------------------------------

const cache = new Map();

export const getFlightCache = (key) => cache.get(key) ?? null;

export const setFlightCache = (key, data) => cache.set(key, data);

export const clearFlightCache = () => cache.clear();
