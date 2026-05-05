/**
 * Flight Service
 * Handles all flight-related API calls and data transformation.
 */

import { parseISODurationToMinutes, detectUserCurrency } from '../utils/flightUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Search flights based on criteria using the Duffel API endpoint.
 * @param {Object} params - Parsed search parameters from URL
 * @returns {Promise<Object>} - Raw API response
 */
export async function searchFlights(params) {
  if (!params) {
    throw new Error('Search parameters are required');
  }

  const currency = detectUserCurrency();

  const queryParams = new URLSearchParams({
    origin: params.from_airport,
    destination: params.to_airport,
    departure_date: params.departure_date,
    adults: params.passengers?.adults || 1,
    children: params.passengers?.children || 0,
    infants: params.passengers?.infants || 0,
    cabin_class: (params.cabin_class || 'economy').toLowerCase(),
    currency,
  });

  const response = await fetch(`${API_BASE_URL}/api/flights/search?${queryParams}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    let detail = `Flight search failed: ${response.statusText}`;
    try {
      const err = await response.json();
      if (err.detail) detail = err.detail;
    } catch { /* ignore parse errors */ }
    throw new Error(detail);
  }

  return await response.json();
}

/**
 * Transform a raw DuffelFlightOffer (from the API) into the shape used by
 * UI components. All fields have safe fallbacks — never throws.
 * @param {Object} duffelFlight
 * @returns {Object}
 */
export function transformFlightData(duffelFlight) {
  return {
    // Identity
    id: duffelFlight.id || `unknown-${Math.random()}`,
    // Airline
    airline: duffelFlight.airline || 'Unknown Airline',
    airlineLogo: duffelFlight.airline_logo || null,
    // Flight metadata
    flightNumber: duffelFlight.flight_number || '—',
    cabinClass: duffelFlight.cabin_class || null,
    fareBrandName: duffelFlight.fare_brand_name || null,
    // Route
    fromAirport: duffelFlight.origin || '—',
    toAirport: duffelFlight.destination || '—',
    // Times (HH:MM strings)
    departureTime: duffelFlight.departure_time || '--:--',
    arrivalTime: duffelFlight.arrival_time || '--:--',
    // Full ISO datetimes for detail rendering
    departureDateTime: duffelFlight.departure_datetime || null,
    arrivalDateTime: duffelFlight.arrival_datetime || null,
    // Duration — kept as raw ISO 8601 for formatDuration(); numeric for sorting
    duration: duffelFlight.duration || null,
    durationMinutes: parseISODurationToMinutes(duffelFlight.duration),
    // Stops
    stops: duffelFlight.stops ?? 0,
    // Price — numeric for sorting, raw string kept for formatPrice()
    price: parseFloat(duffelFlight.price) || 0,
    currency: duffelFlight.currency || 'USD',
    // Extended fields from enriched backend parser
    segments: duffelFlight.segments || [],
    conditions: duffelFlight.conditions || null,
    baggages: duffelFlight.baggages || [],
    totalEmissionsKg: duffelFlight.total_emissions_kg || null,
    passportRequired: duffelFlight.passport_required ?? null,
  };
}
