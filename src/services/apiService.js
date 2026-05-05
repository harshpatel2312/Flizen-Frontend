/**
 * API Service
 * Thin wrappers around backend endpoints used by AirportAutocomplete and
 * FlightListingPage. Flight search lives in flightService.js.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Search airports by query (city, name, IATA code, country).
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchAirports(query) {
  if (!query || query.length < 1) return [];

  const response = await fetch(
    `${API_BASE_URL}/airports/search?q=${encodeURIComponent(query)}`
  );
  if (!response.ok) throw new Error('Airport search failed.');
  return response.json();
}

/**
 * Get a single airport by IATA code.
 * Returns null when the airport is not found (404).
 * @param {string} iata
 * @returns {Promise<Object|null>}
 */
export async function getAirport(iata) {
  if (!iata) return null;

  const response = await fetch(
    `${API_BASE_URL}/airports/${encodeURIComponent(iata.toUpperCase())}`
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Airport lookup failed.');
  return response.json();
}
