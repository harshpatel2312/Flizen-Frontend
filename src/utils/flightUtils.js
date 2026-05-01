/**
 * flightUtils.js
 * Pure helper functions for parsing, formatting, and sorting flight data.
 * All functions accept safe inputs and return graceful fallbacks.
 */

// ---------------------------------------------------------------------------
// Duration
// ---------------------------------------------------------------------------

/**
 * Parse an ISO 8601 duration string to total minutes.
 * @param {string|null} isoDuration - e.g. "PT7H30M", "PT45M", "PT2H"
 * @returns {number} total minutes, 0 if unparseable
 */
export function parseISODurationToMinutes(isoDuration) {
  if (!isoDuration) return 0;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (parseInt(match[1] || 0)) * 60 + parseInt(match[2] || 0);
}

/**
 * Format an ISO 8601 duration to a human-readable string.
 * @param {string|null} isoDuration
 * @returns {string} e.g. "7h 30m", "45m", "—"
 */
export function formatDuration(isoDuration) {
  const total = parseISODurationToMinutes(isoDuration);
  if (!total) return '—';
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ---------------------------------------------------------------------------
// Date / time
// ---------------------------------------------------------------------------

/**
 * Extract HH:MM from a full ISO datetime string or return as-is if already HH:MM.
 * @param {string|null} isoDatetime - "2026-05-20T14:30:00" or "14:30"
 * @returns {string} "14:30" or "--:--"
 */
export function formatTime(isoDatetime) {
  if (!isoDatetime) return '--:--';
  if (isoDatetime.includes('T')) return isoDatetime.slice(11, 16);
  if (/^\d{2}:\d{2}$/.test(isoDatetime)) return isoDatetime;
  return '--:--';
}

/**
 * Format an ISO date string to a short human-readable date.
 * @param {string|null} isoString - "2026-05-20" or "2026-05-20T14:30:00"
 * @returns {string} e.g. "May 20"
 */
export function formatShortDate(isoString) {
  if (!isoString) return '';
  try {
    const dateOnly = isoString.slice(0, 10);
    const [y, m, d] = dateOnly.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  } catch {
    return isoString.slice(0, 10);
  }
}

// ---------------------------------------------------------------------------
// Price
// ---------------------------------------------------------------------------

/**
 * Format a numeric price with currency.
 * @param {number|string|null} amount
 * @param {string|null} currency
 * @returns {string} e.g. "1,250.00 CAD"
 */
export function formatPrice(amount, currency) {
  if (amount == null || amount === '') return '—';
  const num = parseFloat(amount);
  if (isNaN(num)) return '—';
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${formatted} ${currency}` : formatted;
}

// ---------------------------------------------------------------------------
// Stops
// ---------------------------------------------------------------------------

/**
 * Return a display label for a stop count.
 * @param {number} stops
 * @returns {string} "Non-stop", "1 Stop", "2 Stops"
 */
export function getStopsLabel(stops) {
  if (stops === 0) return 'Non-stop';
  return stops === 1 ? '1 Stop' : `${stops} Stops`;
}

// ---------------------------------------------------------------------------
// Layovers
// ---------------------------------------------------------------------------

/**
 * Compute layover info between consecutive segments.
 * @param {Array} segments - flight.segments array from transformed flight
 * @returns {Array<{airport: string, label: string}>}
 */
export function getLayovers(segments) {
  if (!segments || segments.length < 2) return [];
  return segments.slice(0, -1).map((seg, i) => {
    const next = segments[i + 1];
    const arrTime = new Date(seg.arrival_datetime);
    const depTime = new Date(next.departure_datetime);
    const diffMin = Math.round((depTime - arrTime) / 60000);
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    const label = h > 0 ? `${h}h ${m}m` : `${m}m`;
    return { airport: seg.destination, label };
  });
}

// ---------------------------------------------------------------------------
// Currency detection
// ---------------------------------------------------------------------------

/**
 * Currencies officially supported by the Duffel API.
 * @see https://duffel.com/docs/api/overview/currencies
 */
const DUFFEL_SUPPORTED_CURRENCIES = new Set([
  'AED', 'AUD', 'CAD', 'CHF', 'DKK', 'EUR', 'GBP',
  'HKD', 'INR', 'JPY', 'KRW', 'MXN', 'NOK', 'NZD',
  'SAR', 'SEK', 'SGD', 'THB', 'USD', 'ZAR',
]);

/**
 * Infer the user's preferred currency from browser locale.
 * Falls back to USD if the detected currency is not supported by Duffel.
 * @returns {string} ISO 4217 currency code
 */
export function detectUserCurrency() {
  const lang = (
    navigator?.language ||
    navigator?.languages?.[0] ||
    'en-US'
  ).toLowerCase();

  // Region tag from locale (e.g. "ca" from "en-CA")
  const region = lang.split('-')[1] || '';

  const regionToCurrency = {
    ae: 'AED',
    au: 'AUD',
    ca: 'CAD',
    ch: 'CHF',
    dk: 'DKK',
    at: 'EUR', be: 'EUR', cy: 'EUR', ee: 'EUR', fi: 'EUR',
    fr: 'EUR', de: 'EUR', gr: 'EUR', ie: 'EUR', it: 'EUR',
    lv: 'EUR', lt: 'EUR', lu: 'EUR', mt: 'EUR', nl: 'EUR',
    pt: 'EUR', sk: 'EUR', si: 'EUR', es: 'EUR',
    gb: 'GBP',
    hk: 'HKD',
    in: 'INR',
    jp: 'JPY',
    kr: 'KRW',
    mx: 'MXN',
    no: 'NOK',
    nz: 'NZD',
    sa: 'SAR',
    se: 'SEK',
    sg: 'SGD',
    th: 'THB',
    us: 'USD',
    za: 'ZAR',
  };

  const detected = region ? (regionToCurrency[region] || 'USD') : 'USD';
  return DUFFEL_SUPPORTED_CURRENCIES.has(detected) ? detected : 'USD';
}



/**
 * Sort an array of transformed flights by the given sort mode.
 * Does not mutate the original array.
 * @param {Array} flights
 * @param {'best'|'cheapest'|'fastest'} sortBy
 * @returns {Array}
 */
export function sortFlights(flights, sortBy) {
  const sorted = [...flights];
  switch (sortBy) {
    case 'cheapest':
      return sorted.sort((a, b) => a.price - b.price);

    case 'fastest':
      return sorted.sort((a, b) => (a.durationMinutes || 0) - (b.durationMinutes || 0));

    case 'best':
    default: {
      const maxPrice = Math.max(...sorted.map((f) => f.price), 1);
      const maxDur = Math.max(...sorted.map((f) => f.durationMinutes || 0), 1);
      return sorted.sort((a, b) => {
        // Weighted score: 60% price, 30% duration, 10% stops
        const scoreA =
          (a.price / maxPrice) * 0.6 +
          ((a.durationMinutes || 0) / maxDur) * 0.3 +
          (Math.min(a.stops, 3) / 3) * 0.1;
        const scoreB =
          (b.price / maxPrice) * 0.6 +
          ((b.durationMinutes || 0) / maxDur) * 0.3 +
          (Math.min(b.stops, 3) / 3) * 0.1;
        return scoreA - scoreB;
      });
    }
  }
}
