/**
 * Flight Service
 * Handles all flight-related API calls and data transformation.
 */

import { parseISODurationToMinutes, detectUserCurrency } from '../utils/flightUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Search flights based on criteria using the Duffel API endpoint.
 * For round-trip, the backend returns a single Duffel offer per fare whose
 * `slices` array covers both directions and whose `price` is the combined
 * authoritative round-trip total — never a sum of two offers.
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
  if (params.trip_type === 'round-trip' && params.return_date) {
    queryParams.set('return_date', params.return_date);
  }

  const response = await fetch(`${API_BASE_URL}/api/flights/search?${queryParams}`);

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
 *
 * For one-way, this returns a single flight object per offer.
 * For round-trip, prefer {@link transformOfferToRoundTripPair} which splits
 * the offer's two slices into an outbound and inbound view SHARING the same
 * offer id — the only bookable unit.
 *
 * @param {Object} duffelFlight
 * @returns {Object}
 */
export function transformFlightData(duffelFlight) {
  return {
    id: duffelFlight.id || '',
    offerId: duffelFlight.id || '',
    airline: duffelFlight.airline || 'Unknown Airline',
    airlineLogo: duffelFlight.airline_logo || null,
    flightNumber: duffelFlight.flight_number || '—',
    cabinClass: duffelFlight.cabin_class || null,
    fareBrandName: duffelFlight.fare_brand_name || null,
    fromAirport: duffelFlight.origin || '—',
    toAirport: duffelFlight.destination || '—',
    departureTime: duffelFlight.departure_time || '--:--',
    arrivalTime: duffelFlight.arrival_time || '--:--',
    departureDateTime: duffelFlight.departure_datetime || null,
    arrivalDateTime: duffelFlight.arrival_datetime || null,
    duration: duffelFlight.duration || null,
    durationMinutes: parseISODurationToMinutes(duffelFlight.duration),
    stops: duffelFlight.stops ?? 0,
    price: parseFloat(duffelFlight.price) || 0,
    currency: duffelFlight.currency || 'USD',
    segments: duffelFlight.segments || [],
    conditions: duffelFlight.conditions || null,
    baggages: duffelFlight.baggages || [],
    totalEmissionsKg: duffelFlight.total_emissions_kg || null,
    passportRequired: duffelFlight.passport_required ?? null,
    sliceCount: duffelFlight.slice_count ?? 1,
  };
}

// Convert a single slice summary to a shallow, list-card-friendly object.
function sliceToDisplay(slice, offer, role) {
  const segs = slice?.segments || [];
  return {
    // Unique per (offer, direction) so React keys don't collide, but the
    // underlying bookable identity is `offerId`.
    id: `${offer.id}:${role}`,
    offerId: offer.id,
    role, // 'outbound' | 'inbound'
    airline: offer.airline || 'Unknown Airline',
    airlineLogo: offer.airline_logo || null,
    flightNumber: segs[0]?.flight_number || '—',
    cabinClass: offer.cabin_class || null,
    fareBrandName: offer.fare_brand_name || null,
    fromAirport: slice?.origin || '—',
    toAirport: slice?.destination || '—',
    departureTime: slice?.departure_time || '--:--',
    arrivalTime: slice?.arrival_time || '--:--',
    departureDateTime: slice?.departure_datetime || null,
    arrivalDateTime: slice?.arrival_datetime || null,
    duration: slice?.duration || null,
    durationMinutes: parseISODurationToMinutes(slice?.duration),
    stops: slice?.stops ?? 0,
    // Whole-offer price on both cards — the trip is one bookable unit.
    price: parseFloat(offer.price) || 0,
    currency: offer.currency || 'USD',
    segments: segs,
    conditions: offer.conditions || null,
    baggages: offer.baggages || [],
    totalEmissionsKg: offer.total_emissions_kg || null,
    passportRequired: offer.passport_required ?? null,
    sliceCount: offer.slice_count ?? 1,
  };
}

/**
 * Split a two-slice round-trip offer into { outbound, inbound } display
 * objects sharing one `offerId`. Returns `null` for offers without two slices.
 */
export function transformOfferToRoundTripPair(offer) {
  if (!offer || !offer.slices || offer.slices.length < 2) return null;
  return {
    offerId: offer.id,
    outbound: sliceToDisplay(offer.slices[0], offer, 'outbound'),
    inbound:  sliceToDisplay(offer.slices[1], offer, 'inbound'),
  };
}
