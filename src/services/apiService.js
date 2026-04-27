/**
 * API Service
 * Handles all backend API calls with proper error handling and environment variables
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Search airports by query (city, name, IATA code, country)
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of airport objects
 */
export async function searchAirports(query) {
  if (!query || query.length < 1) {
    return [];
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/airports/search?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`Airport search failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Airport search error:', error);
    throw error;
  }
}

/**
 * Get airport details by IATA code
 * @param {string} iata - Airport IATA code
 * @returns {Promise<Object>} - Airport object
 */
export async function getAirport(iata) {
  if (!iata) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/airports/${iata.toUpperCase()}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch airport: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get airport error:', error);
    throw error;
  }
}

/**
 * Search flights
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Object>} - Flight search results
 */
export async function searchFlights(searchParams) {
  try {
    const response = await fetch(`${API_BASE_URL}/flights/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || `Flight search failed: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Flight search error:', error);
    throw error;
  }
}

/**
 * Check API health
 * @returns {Promise<Object>} - Health status
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}
