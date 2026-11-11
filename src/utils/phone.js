// src/utils/phone.js
// ---------------------------------------------------------------------------
// Phone helpers shared by the PhoneInput component (passenger details, profile).
//
// The value stored by forms is E.164 ("+15483333136"); PhoneInput shows the
// country picker + the national number formatted in that country's style.
// The booking API also strips formatting server-side.
// ---------------------------------------------------------------------------

import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/mobile/examples';

const MAX_DIGITS = 15; // E.164 maximum

const digitsOf = (value) => String(value || '').replace(/\D/g, '');

const regionNames =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

/** [{ iso: 'CA', name: 'Canada', code: '1' }, ...] sorted by name. */
export const PHONE_COUNTRIES = getCountries()
  .map((iso) => ({ iso, name: regionNames?.of(iso) || iso, code: getCountryCallingCode(iso) }))
  .sort((a, b) => a.name.localeCompare(b.name));

const COUNTRY_SET = new Set(PHONE_COUNTRIES.map((c) => c.iso));

// When several countries share a calling code, prefer the main one.
const MAIN_COUNTRY_FOR_CODE = {
  1: 'US', 7: 'RU', 44: 'GB', 47: 'NO', 61: 'AU', 212: 'MA', 262: 'RE', 290: 'SH', 358: 'FI', 590: 'GP', 599: 'CW',
};

function countryForCallingCode(code, preferred) {
  if (preferred && getCountryCallingCode(preferred) === String(code)) return preferred;
  return MAIN_COUNTRY_FOR_CODE[code] || PHONE_COUNTRIES.find((c) => c.code === String(code))?.iso || preferred;
}

/** Best guess from the browser locale (e.g. "en-CA" -> "CA"), else US. */
export function defaultPhoneCountry() {
  const locales = typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [];
  for (const locale of locales) {
    const region = String(locale || '').split('-')[1]?.toUpperCase();
    if (region && COUNTRY_SET.has(region)) return region;
  }
  return 'US';
}

/**
 * Format national digits for the selected country.
 * Many countries (FR, GB, DE…) only apply local formatting when the number is
 * typed with its trunk "0", so fall back to the international grouping with the
 * "+code" prefix removed: "612345678" -> "6 12 34 56 78".
 */
function formatForCountry(country, digits) {
  if (!digits) return { display: '', number: undefined };
  const local = new AsYouType(country);
  const localDisplay = local.input(digits);
  if (/[\s()-]/.test(localDisplay)) return { display: localDisplay, number: local.getNumber() };

  const code = getCountryCallingCode(country);
  const intl = new AsYouType();
  const intlDisplay = intl.input(`+${code}${digits}`).replace(new RegExp(`^\\+${code}\\s?`), '');
  return { display: intlDisplay || digits, number: intl.getNumber() };
}

function formatNational(country, digits) {
  return formatForCountry(country, digits).display;
}

/**
 * Split a stored value into { country, national } for display.
 * Handles complete/partial E.164 values and legacy values without "+".
 */
export function parsePhoneValue(value, fallbackCountry) {
  const raw = String(value || '').trim();
  const digits = digitsOf(raw).slice(0, MAX_DIGITS);
  if (!digits) return { country: fallbackCountry, national: '' };

  if (!raw.startsWith('+')) {
    return { country: fallbackCountry, national: formatNational(fallbackCountry, digits) };
  }

  const parsed = parsePhoneNumberFromString(`+${digits}`);
  if (parsed) {
    const country = parsed.country || countryForCallingCode(parsed.countryCallingCode, fallbackCountry);
    return { country, national: formatNational(country, parsed.nationalNumber) };
  }

  // Incomplete number: match the longest known calling code prefix.
  for (let len = 3; len >= 1; len -= 1) {
    const code = digits.slice(0, len);
    if (PHONE_COUNTRIES.some((c) => c.code === code)) {
      const country = countryForCallingCode(code, fallbackCountry);
      return { country, national: formatNational(country, digits.slice(len)) };
    }
  }
  return { country: fallbackCountry, national: formatNational(fallbackCountry, digits) };
}

/**
 * Build the formatted display + E.164 value from the selected country and
 * what's typed in the number box. `previousDisplay` lets Backspace delete a
 * digit when the cursor sits on a formatting character.
 */
export function buildPhoneValue(country, rawNational, previousDisplay = '') {
  let digits = digitsOf(rawNational).slice(0, MAX_DIGITS);
  const deletedOnlyFormatting =
    String(rawNational).length < String(previousDisplay).length && digits === digitsOf(previousDisplay);
  if (deletedOnlyFormatting) digits = digits.slice(0, -1);
  if (!digits) return { display: '', value: '' };

  const { display, number } = formatForCountry(country, digits);
  const value = number?.number || `+${getCountryCallingCode(country)}${digits}`;
  return { display, value };
}

/** Example number for the country, used as the input placeholder. */
export function phonePlaceholder(country) {
  try {
    return getExampleNumber(country, examples)?.formatNational() || '';
  } catch {
    return '';
  }
}

/** "+15483333136", or "" when empty. */
export function toE164(value) {
  const digits = digitsOf(value);
  return digits ? `+${digits}` : '';
}

/** Returns an error message, or undefined when valid. */
export function phoneError(value, { required = true } = {}) {
  const e164 = toE164(value);
  if (!e164) return required ? 'Required' : undefined;
  if (!isValidPhoneNumber(e164)) return 'Enter a valid phone number for the selected country';
  return undefined;
}
