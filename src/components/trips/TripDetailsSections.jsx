// src/components/trips/TripDetailsSections.jsx
// Content of the Trip Details drawer, in reading order: overview, airline
// references, itinerary, travellers with seats & baggage, payment, manage booking,
// activity, and additional information. Everything shown comes from the
// booking details API; missing data is omitted or labelled, never guessed.

import { Link } from 'react-router-dom';
import AirlineLogo from '../AirlineLogo';
import CopyButton from '../CopyButton';
import Sep from '../Sep';
import { STATUS, displayFor, pillClassFor } from '../../utils/bookingStatus';
import { formatDuration, formatPrice, getStopsLabel } from '../../utils/flightUtils';
import {
  formatFlightNumber,
  formatLocalTime,
  formatTimestamp,
  formatTripDate,
  humanizeCode,
  isOfferExpired,
  parseLocalDate,
  paymentStatusDisplay,
  shortBookingId,
  travellerTypeLabel,
  tripCategory,
} from '../../utils/trips';

const PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold hover:opacity-90 transition-opacity';
const SECONDARY_BTN =
  'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-[#2C2C2C] text-primary font-label-md text-label-md font-bold hover:border-[#4A4A4A] transition-colors';

const fullDate = (value) => formatTripDate(value, { weekday: true, withYear: true });
const toMinor = (amount) => {
  const n = parseFloat(amount);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

/** Bookings whose status will still change without user action. */
export function isSettling(b) {
  if (!b) return false;
  if (b.status === STATUS.PAYMENT_RECEIVED || b.status === STATUS.FULFILLING) return true;
  return b.status === STATUS.FAILED_REFUNDING && (b.refund_state === 'initiated' || !b.refund_state);
}

// ── Building blocks ──────────────────────────────────────────────────────

/** `className` overrides the default divider, e.g. when sections sit side by side. */
function Section({ title, children, first = false, className }) {
  return (
    <section className={className ?? (first ? '' : 'pt-6 border-t border-[#2C2C2C]')}>
      <h3 className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-3">{title}</h3>
      {children}
    </section>
  );
}

/** Collapsed-by-default section for secondary information. */
function CollapsibleSection({ title, meta, children }) {
  return (
    <details className="group pt-6 border-t border-[#2C2C2C]">
      <summary className="flex items-center justify-between gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded">
        <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">
          {title}
          {meta && <span className="ml-2 normal-case tracking-normal text-on-surface-variant">{meta}</span>}
        </span>
        <span className="material-symbols-outlined text-[18px] text-outline transition-transform group-open:rotate-180" aria-hidden="true">
          expand_more
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function Row({ label, value, accent, strong = false }) {
  const valueClass =
    accent === 'green' ? 'text-green-400' :
    accent === 'red'   ? 'text-red-400'   :
    accent === 'blue'  ? 'text-blue-400'  :
                         'text-primary';
  return (
    <div className={`flex justify-between gap-4 ${strong ? 'font-headline-md text-headline-md' : 'font-label-md text-label-md'}`}>
      <span className={strong ? 'text-primary' : 'text-outline'}>{label}</span>
      <span className={`text-right tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function Muted({ children }) {
  return <p className="font-label-sm text-label-sm text-outline font-normal">{children}</p>;
}

/** Label above value; for longer values in narrow columns. */
function Rule({ label, value }) {
  return (
    <div>
      <p className="font-label-sm text-label-sm text-outline font-normal">{label}</p>
      <p className="font-label-md text-label-md text-primary">{value}</p>
    </div>
  );
}

function IdRow({ label, display, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-label-md text-label-md text-outline">{label}</span>
      <span className="flex items-center gap-2 min-w-0">
        <span className="font-label-md text-label-md text-on-surface-variant truncate" title={value}>{display}</span>
        <CopyButton value={value} label={label.toLowerCase()} />
      </span>
    </div>
  );
}

// ── 1. Overview ──────────────────────────────────────────────────────────

export function OverviewSection({ details, cityMap }) {
  const fs = details.flight_summary || {};
  const slices = details.itinerary?.slices || [];
  const isRoundTrip = Boolean(fs.is_round_trip || slices.length > 1);
  const city = (code, stored) => stored || cityMap?.[code] || code || '—';
  const from = city(slices[0]?.origin || fs.from_airport, slices[0]?.origin_city);
  const to = city(slices[0]?.destination || fs.to_airport, slices[0]?.destination_city);
  const departDate = fullDate(slices[0]?.departing_at || fs.departure_date);
  const returnDate = isRoundTrip ? fullDate(slices[1]?.departing_at || fs.return_departure_date) : null;
  const travellerCount = details.travellers?.length || details.passenger_count || 0;
  const category = tripCategory(details);
  // Confirmed trips speak for themselves; other states get an explanation.
  const notice = category === 'upcoming' || category === 'completed' ? null : displayFor(details).description;

  return (
    <section>
      <p className="font-headline-md text-headline-md text-primary flex items-center gap-2 flex-wrap">
        <span>{from}</span>
        <span className="material-symbols-outlined text-outline text-[20px]" aria-label={isRoundTrip ? 'round trip to' : 'to'}>
          {isRoundTrip ? 'sync_alt' : 'arrow_right_alt'}
        </span>
        <span>{to}</span>
      </p>
      <p className="mt-1 font-label-md text-label-md text-on-surface-variant">
        {isRoundTrip ? 'Round trip' : 'One way'}
        <Sep />{travellerCount} traveller{travellerCount === 1 ? '' : 's'}
      </p>
      {departDate && (
        <p className="mt-0.5 font-label-md text-label-md text-on-surface-variant">
          {departDate}{returnDate && ` – ${returnDate}`}
        </p>
      )}
      {details.created_at && (
        <p className="mt-2 font-label-sm text-label-sm text-outline font-normal">
          Booked {formatTripDate(new Date(details.created_at), { weekday: false })}
        </p>
      )}
      {notice && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#2C2C2C] bg-[#161616] px-3 py-2.5">
          <span className="material-symbols-outlined text-[16px] leading-5 text-outline" aria-hidden="true">info</span>
          <p className="font-label-sm text-label-sm text-on-surface-variant font-normal">{notice}</p>
        </div>
      )}
    </section>
  );
}

// ── 2. Airline booking reference ─────────────────────────────────────────

export function ReferenceSection({ details, className }) {
  const isConfirmed = details.status === STATUS.CONFIRMED;
  const stored = details.order_details?.airline_references || [];
  const firstSegment = details.itinerary?.slices?.[0]?.segments?.[0];
  const refs = stored.length
    ? stored
    : details.duffel_booking_reference
      ? [{
          reference: details.duffel_booking_reference,
          airline: details.itinerary?.airline || details.flight_summary?.airline,
          airline_logo_url: details.itinerary?.airline_logo_url || details.flight_summary?.airline_logo_url,
          airline_code: firstSegment?.airline_code,
        }]
      : [];

  if (!isConfirmed || !refs.length) {
    const pending = ['pending'].includes(tripCategory(details));
    if (!pending) return null;
    return (
      <Section className={className} title="Airline booking reference">
        <Muted>Your airline reference appears here once the airline confirms the booking.</Muted>
      </Section>
    );
  }

  return (
    <Section className={className} title={refs.length > 1 ? 'Airline booking references' : 'Airline booking reference'}>
      <ul className="space-y-3">
        {refs.map((ref) => (
          <li key={ref.reference} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <AirlineLogo src={ref.airline_logo_url} iataCode={ref.airline_code} name={ref.airline} className="w-8 h-8" />
              <div className="min-w-0">
                <p className="font-headline-md text-headline-md text-primary tracking-[0.15em] tabular-nums">{ref.reference}</p>
                {ref.airline && <p className="font-label-sm text-label-sm text-outline font-normal truncate">{ref.airline}</p>}
              </div>
            </div>
            <CopyButton value={ref.reference} label="airline reference" />
          </li>
        ))}
      </ul>
      <p className="mt-3 font-label-sm text-label-sm text-outline font-normal">
        Use this reference (PNR) to check in and manage your trip with the airline.
      </p>
    </Section>
  );
}

// ── 3. Itinerary ─────────────────────────────────────────────────────────

function layover(prev, next) {
  const a = parseLocalDate(prev?.arriving_at);
  const b = parseLocalDate(next?.departing_at);
  // Both are local times at the same (connecting) airport, so the difference is exact.
  if (!a || !b || b <= a || prev.destination !== next.origin) return null;
  const mins = Math.round((b - a) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

/** "Toronto Pearson International Airport" already names the city; avoid repeating it. */
function airportLine(name, city) {
  if (!name) return city || null;
  if (!city || name.toLowerCase().includes(city.toLowerCase())) return name;
  return `${name}, ${city}`;
}

function Endpoint({ time, date, code, name, city, terminal, align = 'left' }) {
  const right = align === 'right';
  const meta = [date, terminal && `Terminal ${terminal}`].filter(Boolean).join(' · ');
  return (
    <div className={`min-w-0 ${right ? 'text-right' : ''}`}>
      <p className="font-headline-md text-headline-md text-primary tabular-nums leading-none">{time}</p>
      <p className="mt-2 font-label-md text-label-md text-primary font-semibold tracking-wide">{code || '—'}</p>
      {airportLine(name, city) && (
        <p className="font-label-sm text-label-sm text-on-surface-variant font-normal">{airportLine(name, city)}</p>
      )}
      {meta && <p className="mt-0.5 font-label-sm text-label-sm text-outline font-normal">{meta}</p>}
    </div>
  );
}

function SegmentBlock({ seg, cityMap }) {
  const details = [formatFlightNumber(seg.flight_number), seg.cabin, seg.aircraft].filter(Boolean);
  const operatedBy = seg.operating_airline && seg.operating_airline !== seg.airline ? seg.operating_airline : null;
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <AirlineLogo src={seg.airline_logo_url} iataCode={seg.airline_code} name={seg.airline} className="w-7 h-7" />
        <p className="font-label-md text-label-md text-primary min-w-0">
          {seg.airline || 'Airline'}
          <span className="text-outline font-normal">
            {details.map((d, i) => (<span key={i}><Sep />{d}</span>))}
            {operatedBy && (<><Sep />Operated by {operatedBy}</>)}
          </span>
        </p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(6rem,0.6fr)_minmax(0,1fr)] items-start gap-4">
        <Endpoint
          time={formatLocalTime(seg.departing_at)}
          date={fullDate(seg.departing_at)}
          code={seg.origin}
          name={seg.origin_name}
          city={seg.origin_city || cityMap?.[seg.origin]}
          terminal={seg.origin_terminal}
        />
        <div className="flex flex-col items-center gap-1.5 pt-1" aria-hidden="true">
          <p className="font-label-sm text-label-sm text-outline leading-none">{formatDuration(seg.duration)}</p>
          <div className="w-full flex items-center">
            <div className="w-2 h-2 rounded-full bg-outline shrink-0" />
            <div className="flex-1 h-px bg-[#2C2C2C]" />
            <div className="w-2 h-2 rounded-full bg-outline shrink-0" />
          </div>
        </div>
        <Endpoint
          align="right"
          time={formatLocalTime(seg.arriving_at)}
          date={fullDate(seg.arriving_at)}
          code={seg.destination}
          name={seg.destination_name}
          city={seg.destination_city || cityMap?.[seg.destination]}
          terminal={seg.destination_terminal}
        />
      </div>
    </div>
  );
}

function SliceBlock({ slice, label, cityMap }) {
  const segments = slice.segments || [];
  const stops = slice.stops ?? Math.max(segments.length - 1, 0);
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-5">
        <p className="font-label-md text-label-md text-primary font-semibold">{label}</p>
        <p className="font-label-sm text-label-sm text-outline whitespace-nowrap">
          {segments.length > 1
            ? (<>Total {formatDuration(slice.duration)}<Sep />{getStopsLabel(stops)}</>)
            : getStopsLabel(stops)}
        </p>
      </div>
      <ol className="space-y-5">
        {segments.map((seg, i) => (
          <li key={i}>
            {i > 0 && layover(segments[i - 1], seg) && (
              <div className="mb-5 flex items-center gap-3 font-label-sm text-label-sm text-on-surface-variant font-normal">
                <div className="flex-1 border-t border-dashed border-[#2C2C2C]" />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1A1A] border border-[#2C2C2C] px-3 py-1">
                  <span className="material-symbols-outlined text-[14px] leading-none text-outline" aria-hidden="true">schedule</span>
                  {layover(segments[i - 1], seg)} layover in {seg.origin_city || cityMap?.[seg.origin] || seg.origin}
                </span>
                <div className="flex-1 border-t border-dashed border-[#2C2C2C]" />
              </div>
            )}
            <SegmentBlock seg={seg} cityMap={cityMap} />
          </li>
        ))}
      </ol>
    </div>
  );
}

const sliceLabel = (count, i) => (count > 1 ? (i === 0 ? 'Departure flight' : 'Return flight') : 'Flight');

export function ItinerarySection({ details, cityMap }) {
  const slices = details.itinerary?.slices || [];
  if (!slices.length) {
    const fs = details.flight_summary || {};
    const city = (c) => (cityMap?.[c] ? `${cityMap[c]} (${c})` : c || '—');
    const legs = [
      { label: fs.is_round_trip ? 'Departure flight' : 'Flight', from: fs.from_airport, to: fs.to_airport, date: fs.departure_date },
      ...(fs.is_round_trip
        ? [{ label: 'Return flight', from: fs.return_from_airport, to: fs.return_to_airport, date: fs.return_departure_date }]
        : []),
    ];
    return (
      <Section title="Itinerary">
        <div className="space-y-4">
          {legs.map((leg) => (
            <div key={leg.label}>
              <p className="font-label-md text-label-md text-primary font-semibold">{leg.label}</p>
              <p className="font-label-md text-label-md text-on-surface-variant mt-1">{city(leg.from)} → {city(leg.to)}</p>
              <Muted>{fullDate(leg.date) || 'Date unavailable'}{fs.airline && ` · ${fs.airline}`}</Muted>
            </div>
          ))}
          <Muted>Flight times aren&apos;t available for this booking.</Muted>
        </div>
      </Section>
    );
  }
  return (
    <Section title="Itinerary">
      <div className="space-y-6">
        {slices.map((slice, i) => (
          <div key={i} className={i > 0 ? 'pt-6 border-t border-dashed border-[#2C2C2C]' : ''}>
            <SliceBlock slice={slice} label={sliceLabel(slices.length, i)} cityMap={cityMap} />
          </div>
        ))}
        <Muted>All times are local to each airport.</Muted>
      </div>
    </Section>
  );
}

// ── 4. Travellers, seats & baggage ───────────────────────────────────────

const BAG_LABEL = { checked: ['checked bag', 'checked bags'], carry_on: ['carry-on bag', 'carry-on bags'] };

function bagsLabel(baggages) {
  const parts = (baggages || [])
    .filter((b) => b.quantity > 0)
    .map((b) => {
      const [one, many] = BAG_LABEL[b.type] || [humanizeCode(b.type)?.toLowerCase() || 'bag', 'bags'];
      return `${b.quantity} ${b.quantity === 1 ? one : many}`;
    });
  return parts.length ? parts.join(' · ') : 'No bags included';
}

const travellerName = (details, index) => {
  const t = details.travellers?.[index];
  const name = t ? `${t.given_name} ${t.family_name}`.trim() : '';
  return name || `Traveller ${index + 1}`;
};

/**
 * One section for people, tickets, seats, and bags. When every traveller has the
 * same allowance on every flight and no seats are assigned, it collapses to a
 * summary instead of repeating the same rows per flight.
 */
export function TravellersSection({ details }) {
  const travellers = details.travellers || [];
  const tickets = details.order_details?.tickets || [];
  const segments = (details.itinerary?.slices || []).flatMap((s) => s.segments || []);
  const withData = segments.filter((seg) => seg.travellers?.length);
  const count = travellers.length || details.passenger_count || 0;
  if (!count) return null;

  const indices = Array.from({ length: count }, (_, i) => i);
  const cell = (seg, i) => seg.travellers?.find((t) => t.passenger_index === i);
  const bagSet = new Set(withData.flatMap((seg) => indices.map((i) => bagsLabel(cell(seg, i)?.baggages))));
  const anySeat = withData.some((seg) => seg.travellers.some((t) => t.seat));
  const uniform = withData.length > 0 && bagSet.size === 1 && !anySeat;
  const hasTickets = tickets.length > 0;
  const showTable = withData.length > 0 && !uniform;
  const typeOf = (i) => travellerTypeLabel(travellers[i]?.type);

  return (
    <Section title={withData.length ? 'Travellers, seats & baggage' : 'Travellers'}>
      {hasTickets ? (
        <ul className="divide-y divide-[#2C2C2C]">
          {indices.map((i) => {
            const ticket = tickets.find((k) => k.passenger_index === i)?.number;
            return (
              <li key={i} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">person</span>
                  <span className="font-label-md text-label-md text-primary truncate">{travellerName(details, i)}</span>
                  <span className="font-label-sm text-label-sm text-outline font-normal">{typeOf(i)}</span>
                </span>
                {ticket && (
                  <span className="flex items-center gap-2 font-label-sm text-label-sm text-outline font-normal">
                    E-ticket <span className="text-on-surface-variant tabular-nums">{ticket}</span>
                    <CopyButton value={ticket} label="e-ticket number" />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : !showTable && (
        // Names only: compact chips (the seat table, when shown, already lists them).
        <ul className="flex flex-wrap gap-2">
          {indices.map((i) => (
            <li key={i} className="inline-flex items-center gap-2 rounded-full border border-[#2C2C2C] pl-2 pr-3 py-1">
              <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">person</span>
              <span className="font-label-md text-label-md text-primary">{travellerName(details, i)}</span>
              <span className="font-label-sm text-label-sm text-outline font-normal">{typeOf(i)}</span>
            </li>
          ))}
        </ul>
      )}

      {withData.length === 0 ? (
        <div className="mt-3"><Muted>Seat and baggage details aren&apos;t available for this booking.</Muted></div>
      ) : uniform ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="flex flex-wrap items-center gap-x-2 rounded-lg bg-[#1A1A1A] px-3 py-2.5">
            <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">luggage</span>
            <span className="font-label-md text-label-md text-primary">{[...bagSet][0]}</span>
            <span className="font-label-sm text-label-sm text-outline font-normal">{count > 1 ? 'each, every flight' : 'every flight'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#1A1A1A] px-3 py-2.5">
            <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">airline_seat_recline_normal</span>
            <span className="font-label-md text-label-md text-on-surface-variant">No seats assigned by the airline</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-[#2C2C2C]">
          <table className="w-full text-left">
            <thead className="bg-[#1A1A1A]">
              <tr className="font-label-sm text-label-sm text-outline">
                <th scope="col" className="px-3 py-2 font-semibold uppercase tracking-widest">Flight</th>
                {indices.map((i) => (
                  <th key={i} scope="col" className="px-3 py-2 font-semibold">
                    <span className="text-on-surface-variant">{travellerName(details, i)}</span>
                    <span className="ml-1.5 font-normal">{typeOf(i)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2C2C]">
              {withData.map((seg, r) => (
                <tr key={r} className="align-top">
                  <th scope="row" className="px-3 py-2.5 font-normal whitespace-nowrap">
                    <p className="font-label-md text-label-md text-primary">{seg.origin} → {seg.destination}</p>
                    <p className="font-label-sm text-label-sm text-outline font-normal">{formatFlightNumber(seg.flight_number)}</p>
                  </th>
                  {indices.map((i) => {
                    const t = cell(seg, i);
                    return (
                      <td key={i} className="px-3 py-2.5">
                        <p className={`font-label-md text-label-md ${t?.seat ? 'text-primary' : 'text-outline'}`}>
                          {t?.seat ? `Seat ${t.seat}` : 'No seat'}
                        </p>
                        <p className="font-label-sm text-label-sm text-outline font-normal">{bagsLabel(t?.baggages)}</p>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {withData.length > 0 && (
        <div className="mt-2"><Muted>Seats appear once assigned by the airline. Bag weight limits are set by the airline.</Muted></div>
      )}
    </Section>
  );
}

// ── 5. Payment summary ───────────────────────────────────────────────────

const SERVICE_LABEL = { seat: 'Seat selection', baggage: 'Additional baggage' };

export function PaymentSection({ details, className }) {
  const payments = details.payments || [];
  const currency = details.currency;
  const paid = payments.find((p) => ['succeeded', 'partially_refunded', 'refunded'].includes(p.status));
  const latest = payments[payments.length - 1];
  // Bookings refunded before payment records existed have no refund record.
  const legacyRefund = !payments.length && details.status === STATUS.REFUNDED
    ? { status: 'refunded', amount_refunded: details.amount, currency, refunded_at: details.refunded_at }
    : null;
  const refunded = payments.find((p) => p.amount_refunded) || legacyRefund;
  const statusKey = refunded?.status || paid?.status || latest?.status || details.payment_status;
  const statusInfo = paymentStatusDisplay(statusKey);
  const isPaid = Boolean(paid) || [STATUS.CONFIRMED, STATUS.PAYMENT_RECEIVED, STATUS.FULFILLING].includes(details.status);

  // Fare breakdown only when it adds up exactly to what was charged.
  const od = details.order_details || {};
  const services = (od.services || []).filter((s) => !s.currency || s.currency === currency);
  const breakdown = [
    od.base_amount != null && { label: 'Base fare', amount: od.base_amount },
    od.tax_amount != null && { label: 'Taxes & fees', amount: od.tax_amount },
    ...services.map((s) => ({
      label: `${SERVICE_LABEL[s.type] || humanizeCode(s.type)}${s.quantity > 1 ? ` ×${s.quantity}` : ''}`,
      amount: s.amount,
    })),
  ].filter(Boolean);
  const breakdownTotal = breakdown.reduce((sum, r) => sum + (toMinor(r.amount) ?? NaN), 0);
  const showBreakdown =
    od.currency === currency && breakdown.length >= 2 && breakdownTotal === toMinor(details.amount);

  const refundedMinor = refunded ? toMinor(refunded.amount_refunded) : null;
  const originalMinor = toMinor(paid?.amount || details.amount);
  const remaining = refunded?.status === 'partially_refunded' && refundedMinor != null && originalMinor != null
    ? ((originalMinor - refundedMinor) / 100).toFixed(2)
    : null;

  return (
    <Section className={className} title="Payment summary">
      <div className="space-y-2">
        {showBreakdown && breakdown.map((r) => (
          <Row key={r.label} label={r.label} value={formatPrice(r.amount, currency)} />
        ))}
        <div className={showBreakdown ? 'pt-2 mt-1 border-t border-[#2C2C2C]' : ''}>
          <Row strong label={isPaid ? 'Total paid' : details.status === STATUS.DRAFT ? 'Amount due' : 'Total'} value={formatPrice(details.amount, currency)} />
        </div>
        {statusKey && (
          <Row label="Payment status" value={statusInfo.label} accent={statusInfo.tone === 'gray' ? undefined : statusInfo.tone} />
        )}
        {(paid?.succeeded_at || details.payment_received_at) && (
          <Row label="Paid on" value={formatTimestamp(paid?.succeeded_at || details.payment_received_at)} />
        )}
      </div>

      {(refunded || (details.status === STATUS.FAILED_REFUNDING && details.refund_state === 'initiated')) && (
        <div className="mt-4 rounded-lg bg-[#1A1A1A] border border-[#2C2C2C] px-3 py-3 space-y-2">
          {refunded ? (
            <>
              <Row label="Original payment" value={formatPrice(paid?.amount || details.amount, currency)} />
              <Row label="Refunded" value={formatPrice(refunded.amount_refunded, refunded.currency || currency)} accent="blue" />
              <Row label="Refund status" value={refunded.status === 'partially_refunded' ? 'Partially refunded' : 'Refunded'} />
              {refunded.refunded_at && <Row label="Refunded on" value={formatTimestamp(refunded.refunded_at)} />}
              {remaining && <Row label="Remaining balance" value={formatPrice(remaining, currency)} />}
              <Muted>Refunds go back to the original payment method.</Muted>
            </>
          ) : (
            <Row label="Refund" value="In progress" accent="blue" />
          )}
        </div>
      )}

      {payments.length > 1 && (
        <div className="mt-4">
          <p className="font-label-sm text-label-sm text-outline mb-2">Payment attempts</p>
          <ul className="rounded-lg border border-[#2C2C2C] divide-y divide-[#2C2C2C]">
            {payments.map((p, i) => {
              const s = paymentStatusDisplay(p.status);
              return (
                <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-label-sm text-label-sm text-primary">{formatTimestamp(p.created_at) || 'Attempt'}</p>
                    {p.failure_code && <Muted>{humanizeCode(p.failure_code)}</Muted>}
                  </div>
                  <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${pillClassFor(s.tone)}`}>{s.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="mt-3 font-label-sm text-label-sm text-outline font-normal">
        Payment is processed securely by Stripe; the airline confirms your booking separately. Card details are never stored by Flizen.
      </p>
    </Section>
  );
}

// ── 6. Manage booking ────────────────────────────────────────────────────

function conditionText(c) {
  if (!c) return null;
  if (!c.allowed) return 'Not allowed';
  const fee = toMinor(c.penalty_amount);
  if (c.penalty_amount == null) return 'Allowed';
  return fee ? `Allowed · ${formatPrice(c.penalty_amount, c.penalty_currency)} fee` : 'Allowed · no fee';
}

/** What Manage booking can show for this booking (nothing => the section is hidden). */
function manageOptions(details) {
  const payable =
    (details.status === STATUS.DRAFT || details.status === STATUS.PAYMENT_FAILED) && !isOfferExpired(details);
  const category = tripCategory(details);
  const conditions = details.order_details?.conditions || {};
  const refund = conditionText(conditions.refund_before_departure);
  const change = conditionText(conditions.change_before_departure);
  const carriageLinks = (details.order_details?.airline_references || []).filter((r) => r.conditions_of_carriage_url);
  const showRules = Boolean(refund || change) && ['upcoming', 'pending'].includes(category);
  const action =
    payable ? 'pay' :
    isSettling(details) ? 'status' :
    ['cancelled', 'refunded'].includes(category) || details.status === STATUS.PAYMENT_FAILED ? 'search' :
    null;
  return { refund, change, carriageLinks, showRules, action };
}

export const hasManageOptions = (details) => {
  const o = manageOptions(details);
  return Boolean(o.action || o.showRules || o.carriageLinks.length);
};

export function ManageSection({ details, className }) {
  const id = encodeURIComponent(details.booking_id);
  const { refund, change, carriageLinks, showRules, action } = manageOptions(details);

  let primary = null;
  if (action === 'pay') {
    primary = (
      <Link to={`/payment/${id}`} className={PRIMARY_BTN}>
        <span className="material-symbols-outlined text-[18px]">credit_card</span>
        {details.status === STATUS.PAYMENT_FAILED ? 'Try payment again' : 'Complete payment'}
      </Link>
    );
  } else if (action === 'status') {
    primary = (
      <Link to={`/booking/${id}`} className={SECONDARY_BTN}>
        <span className="material-symbols-outlined text-[18px]">monitoring</span>
        View live status
      </Link>
    );
  } else if (action === 'search') {
    primary = (
      <Link to="/dashboard" className={SECONDARY_BTN}>
        <span className="material-symbols-outlined text-[18px]">search</span>
        Search flights again
      </Link>
    );
  }

  if (!primary && !showRules && !carriageLinks.length) return null;

  return (
    <Section className={className} title="Manage booking">
      {showRules && (
        <div className="space-y-2">
          {refund && <Rule label="Cancel & refund before departure" value={refund} />}
          {change && <Rule label="Changes before departure" value={change} />}
          <Muted>
            Fare rules set by the airline.
            {details.status === STATUS.CONFIRMED && ' To cancel or change, contact the airline with your booking reference.'}
          </Muted>
        </div>
      )}
      {carriageLinks.map((r) => (
        <a
          key={r.reference}
          href={r.conditions_of_carriage_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${showRules ? 'mt-3' : ''} flex items-center justify-between gap-3 rounded-lg border border-[#2C2C2C] px-3 py-2.5 font-label-md text-label-md text-primary hover:border-[#4A4A4A] transition-colors`}
        >
          <span>{r.airline ? `${r.airline} conditions of carriage` : 'Airline conditions of carriage'}</span>
          <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">open_in_new</span>
        </a>
      ))}
      {primary && <div className="mt-4 flex justify-center">{primary}</div>}
    </Section>
  );
}

// ── 7. Booking activity ──────────────────────────────────────────────────

const TONE_CLASS = {
  green: 'bg-green-500/20 text-green-400',
  red:   'bg-red-500/20 text-red-400',
  blue:  'bg-blue-500/20 text-blue-400',
};

export function ActivitySection({ details }) {
  const events = [
    { at: details.created_at, label: 'Booking initiated', icon: 'edit_note' },
    { at: details.payment_failed_at, label: 'Payment declined', icon: 'credit_card_off', tone: 'red' },
    { at: details.payment_received_at, label: 'Payment received', icon: 'credit_card' },
    { at: details.confirmed_at, label: 'Airline booking confirmed', icon: 'check_circle', tone: 'green' },
    { at: details.canceled_at, label: 'Booking cancelled', icon: 'cancel', tone: 'red' },
    { at: details.refund_initiated_at, label: 'Refund initiated', icon: 'currency_exchange', tone: 'blue' },
    { at: details.refunded_at, label: 'Refund completed', icon: 'currency_exchange', tone: 'blue' },
  ]
    .filter((e) => e.at)
    .sort((a, b) => new Date(a.at) - new Date(b.at));

  if (!events.length) return null;
  return (
    <CollapsibleSection title="Booking activity" meta={`${events.length} event${events.length === 1 ? '' : 's'}`}>
      <ol className="space-y-3">
        {events.map((e, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${TONE_CLASS[e.tone] || 'bg-[#2C2C2C] text-outline'}`}>
              <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">{e.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="font-label-md text-label-md text-primary">{e.label}</p>
              <p className="font-label-sm text-label-sm text-outline font-normal">{formatTimestamp(e.at)}</p>
            </div>
          </li>
        ))}
      </ol>
    </CollapsibleSection>
  );
}

// ── 8. Additional information ────────────────────────────────────────────

export function AdditionalInfoSection({ details }) {
  return (
    <CollapsibleSection title="Additional information">
      <div className="space-y-2">
        <IdRow label="Booking ID" display={shortBookingId(details.booking_id)} value={details.booking_id} />
        {details.duffel_order_id && (
          <IdRow label="Duffel order ID" display={shortBookingId(details.duffel_order_id)} value={details.duffel_order_id} />
        )}
        {details.created_at && <Row label="Created" value={formatTimestamp(details.created_at)} />}
        {details.updated_at && <Row label="Last updated" value={formatTimestamp(details.updated_at)} />}
        {details.contact_email && <Row label="Updates sent to" value={details.contact_email} />}
      </div>
    </CollapsibleSection>
  );
}
