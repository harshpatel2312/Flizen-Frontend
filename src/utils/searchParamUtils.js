/**
 * Flight Search Utilities
 * Helper functions for flight search parameter handling
 */

/**
 * Parse search params from URLSearchParams
 * @param {URLSearchParams} searchParams - URL search params
 * @returns {Object} - Parsed search criteria
 */
export function parseSearchParams(searchParams) {
  return {
    from_airport: searchParams.get('from') || 'JFK',
    to_airport: searchParams.get('to') || 'LHR',
    departure_date: searchParams.get('departureDate') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    return_date: searchParams.get('returnDate') || null,
    passengers: {
      adults: parseInt(searchParams.get('adults') || '1'),
      children: parseInt(searchParams.get('children') || '0'),
      infants: parseInt(searchParams.get('infants') || '0'),
    },
    cabin_class: searchParams.get('cabinClass') || 'Economy',
  };
}
