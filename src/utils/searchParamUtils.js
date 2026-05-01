/**
 * Flight Search Utilities
 * Helper functions for flight search parameter handling
 */

/**
 * Get default search params
 * @returns {URLSearchParams} - Default search parameters
 */
export function getDefaultSearchParams() {
  const today = new Date();
  const departDate = new Date(today);
  departDate.setDate(departDate.getDate() + 7); // 7 days from now

  const params = new URLSearchParams({
    from: 'JFK',
    to: 'LHR',
    departureDate: departDate.toISOString().split('T')[0],
    adults: '1',
    children: '0',
    infants: '0',
    cabinClass: 'Economy',
  });

  return params;
}

/**
 * Build search params from search criteria
 * @param {Object} criteria - Search criteria object
 * @returns {URLSearchParams} - URL search parameters
 */
export function buildSearchParams(criteria) {
  const params = new URLSearchParams({
    from: criteria.from || 'JFK',
    to: criteria.to || 'LHR',
    departureDate: criteria.departureDate,
    adults: criteria.adults || '1',
    children: criteria.children || '0',
    infants: criteria.infants || '0',
    cabinClass: criteria.cabinClass || 'Economy',
  });

  if (criteria.returnDate) {
    params.append('returnDate', criteria.returnDate);
  }

  return params;
}

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
