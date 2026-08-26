// src/pages/SeatSelectionPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Multi-segment seat selection page.
// Handles connecting flights and round trips — one seat map per flight leg,
// navigated via a horizontal stepper. Selections are keyed by segment.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SeatMap from '../components/SeatMap';
import { formatDuration } from '../utils/flightUtils';
import { getAirport } from '../services/apiService';
import { buildDraftPayload, createBookingDraft } from '../services/bookingService';

// ─── Passenger colour palette (mirrors SeatMap.jsx) ──────────────────────────
const P_COLORS = [
  { bg: '#FFFFFF', text: '#141313' },
  { bg: '#4C6EF5', text: '#FFFFFF' },
  { bg: '#2ECC71', text: '#FFFFFF' },
  { bg: '#F59F00', text: '#141313' },
  { bg: '#FA5252', text: '#FFFFFF' },
  { bg: '#CC5DE8', text: '#FFFFFF' },
];

function getSeatTypeLabel(type) {
  if (type === 'business') return 'Business';
  if (type === 'premium') return 'Premium Economy';
  return 'Economy';
}

// Returns "City (CODE)" when the city is known, otherwise just "CODE"
function airportLabel(code, cityMap) {
  if (!code || code === '\u2014') return code || '\u2014';
  const city = cityMap?.[code];
  return city ? `${city} (${code})` : code;
}

// ─── Build flat segment list from outbound + (optional) inbound flight ────────
//
// Each element: {
//   key:              'outbound-0' | 'inbound-1' …
//   direction:        'outbound' | 'inbound'
//   directionLabel:   'Departure' | 'Return' | null
//   segIndexInFlight: 0, 1, 2 …
//   totalInFlight:    how many legs this flight has
//   origin, destination, airline, flightNumber,
//   departureTime, arrivalTime, duration, aircraftName
// }
function buildAllSegments(outboundFlight, inboundFlight) {
  const result = [];

  const pushSegs = (flight, direction, directionLabel) => {
    const raw = flight.segments?.length > 0
      ? flight.segments
      : [{
          origin:             flight.fromAirport,
          destination:        flight.toAirport,
          airline:            flight.airline,
          flight_number:      flight.flightNumber || '—',
          departure_datetime: flight.departureDateTime,
          arrival_datetime:   flight.arrivalDateTime,
          duration:           flight.duration,
          aircraft_name:      null,
        }];

    raw.forEach((seg, i) => {
      result.push({
        key:              `${direction}-${i}`,
        direction,
        directionLabel,
        segIndexInFlight: i,
        totalInFlight:    raw.length,
        origin:           seg.origin,
        destination:      seg.destination,
        airline:          seg.airline,
        flightNumber:     seg.flight_number || '—',
        duration:         seg.duration || null,
        departureTime:    seg.departure_datetime?.slice(11, 16) || '—',
        arrivalTime:      seg.arrival_datetime?.slice(11, 16)   || '—',
        aircraftName:     seg.aircraft_name || null,
      });
    });
  };

  pushSegs(outboundFlight, 'outbound', inboundFlight ? 'Departure' : null);
  if (inboundFlight) pushSegs(inboundFlight, 'inbound', 'Return');

  return result;
}

// ─── Segment stepper ─────────────────────────────────────────────────────────

function SegmentStepper({ segments, activeIdx, selectedSeats, totalPassengers, cityMap, onSegmentClick }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
      {segments.map((seg, i) => {
        const seatsForSeg = selectedSeats[seg.key] || [];
        const filled = seatsForSeg.filter(Boolean).length;
        const complete = filled === totalPassengers;
        const isActive = activeIdx === i;

        return (
          <button
            key={seg.key}
            onClick={() => onSegmentClick(i)}
            className={`flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-150 text-left ${
              isActive
                ? 'bg-primary text-on-primary border-primary'
                : complete
                ? 'bg-[#181818] border-[#2C2C2C] text-primary'
                : 'bg-transparent border-[#2C2C2C] text-outline hover:border-[#4A4A4A] hover:text-primary'
            }`}
          >
            {/* Step number / check */}
            <div
              className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                isActive
                  ? 'bg-black/20 text-on-primary'
                  : complete
                  ? 'bg-[#2C2C2C] text-green-400'
                  : 'bg-[#1C1C1C] text-[#888]'
              }`}
            >
              {complete && !isActive
                ? <span className="material-symbols-outlined text-[14px]">check</span>
                : i + 1}
            </div>

            <div>
              {/* Direction badge */}
              {seg.directionLabel && (
                <p className={`text-[9px] uppercase tracking-widest font-semibold mb-0.5 ${
                  isActive ? 'text-on-primary/60' : 'text-[#888]'
                }`}>
                  {seg.directionLabel}
                  {seg.totalInFlight > 1 && ` · Leg ${seg.segIndexInFlight + 1}`}
                </p>
              )}
              <p className={`font-label-md text-label-md leading-none ${
                isActive ? 'text-on-primary' : complete ? 'text-primary' : 'text-[#aaa]'
              }`}>
                {airportLabel(seg.origin, cityMap)} → {airportLabel(seg.destination, cityMap)}
              </p>
              <p className={`text-[10px] mt-0.5 ${
                isActive ? 'text-on-primary/60' : 'text-[#888]'
              }`}>
                {seg.airline} {seg.flightNumber}
              </p>
            </div>

            {/* Seat count badge */}
            {filled > 0 && (
              <div className={`ml-1 flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-black/20 text-on-primary' : 'bg-[#2C2C2C] text-outline'
              }`}>
                {filled}/{totalPassengers}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Summary panel ─────────────────────────────────────────────────────────────

function SummaryPanel({
  segments,
  totalPassengers,
  activePassenger,
  selectedSeats,
  activeSegmentIdx,
  cityMap,
  onPassengerClick,
  onContinue,
  onNext,
  isLastSegment,
  checkoutLoading,
  checkoutError,
}) {
  const totalRequired = segments.length * totalPassengers;
  const totalFilled = segments.reduce(
    (acc, seg) => acc + (selectedSeats[seg.key] || []).filter(Boolean).length,
    0
  );

  // Group segments by direction for display
  const directions = [];
  let lastDir = null;
  for (const seg of segments) {
    if (seg.direction !== lastDir) {
      directions.push({ dir: seg.direction, label: seg.directionLabel, segs: [seg] });
      lastDir = seg.direction;
    } else {
      directions[directions.length - 1].segs.push(seg);
    }
  }

  const allFilled = totalFilled === totalRequired;

  return (
    <div className="bg-[#1F1F1F] border border-[#2C2C2C] rounded-xl p-6 shadow-[0_0_32px_rgba(0,0,0,0.4)] max-h-[calc(100vh-7rem)] overflow-y-auto flight-details-scroll">
      <h2 className="font-headline-md text-headline-md text-primary mb-5">Seat Summary</h2>

      {/* Segment groups */}
      <div className="flex flex-col gap-5 mb-5">
        {directions.map(({ dir, label, segs }) => (
          <div key={dir}>
            {label && (
              <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-2">
                {label}
              </p>
            )}
            {segs.map((seg) => {
              const seatsForSeg = selectedSeats[seg.key] || [];
              const globalIdx = segments.indexOf(seg);
              const isActiveSeg = globalIdx === activeSegmentIdx;
              return (
                <div
                  key={seg.key}
                  className={`mb-3 last:mb-0 rounded-xl border px-4 py-3 transition-colors ${
                    isActiveSeg ? 'border-[#3C3C3C] bg-[#1A1A1A]' : 'border-[#252525] bg-transparent'
                  }`}
                >
                  {/* Leg header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[13px] text-outline">
                        {dir === 'outbound' ? 'flight_takeoff' : 'flight_land'}
                      </span>
                      <p className="font-label-sm text-label-sm text-primary">
                        {airportLabel(seg.origin, cityMap)} → {airportLabel(seg.destination, cityMap)}
                      </p>
                    </div>
                    {seg.totalInFlight > 1 && (
                      <span className="text-[9px] text-[#888] uppercase tracking-widest">
                        Leg {seg.segIndexInFlight + 1}
                      </span>
                    )}
                  </div>
                  <p className="font-label-sm text-label-sm text-[#888] mb-3">
                    {seg.airline} {seg.flightNumber}
                    {seg.departureTime !== '—' && ` · ${seg.departureTime}–${seg.arrivalTime}`}
                  </p>

                  {/* Per-passenger rows */}
                  <div className="flex flex-col gap-1.5">
                    {Array.from({ length: totalPassengers }, (_, i) => {
                      const color = P_COLORS[i % P_COLORS.length];
                      const seat = seatsForSeg[i];
                      const isActive = activePassenger === i && isActiveSeg;
                      return (
                        <button
                          key={i}
                          onClick={() => onPassengerClick(i, globalIdx)}
                          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg w-full text-left transition-colors ${
                            isActive ? 'bg-[#252525]' : 'hover:bg-[#1C1C1C]'
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
                            style={{ backgroundColor: color.bg, color: color.text }}
                          >
                            {i + 1}
                          </div>
                          <span className="flex-1 font-label-sm text-label-sm text-on-surface-variant">
                            Pax {i + 1}
                          </span>
                          {seat ? (
                            <span
                              className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                              style={{ backgroundColor: color.bg, color: color.text }}
                            >
                              {seat.id}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#666]">—</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">
            Overall Progress
          </span>
          <span className="font-label-sm text-label-sm text-primary tabular-nums">
            {totalFilled} / {totalRequired}
          </span>
        </div>
        <div className="h-1.5 bg-[#252525] rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: totalRequired > 0 ? `${(totalFilled / totalRequired) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Primary CTA */}
      {!isLastSegment ? (
        <button
          onClick={onNext}
          className="w-full py-3 rounded-full font-label-md text-label-md font-bold bg-primary text-on-primary hover:opacity-90 transition-opacity cursor-pointer"
        >
          Next: {airportLabel(segments[activeSegmentIdx + 1]?.origin, cityMap)} → {airportLabel(segments[activeSegmentIdx + 1]?.destination, cityMap)}
        </button>
      ) : (
        <button
          onClick={onContinue}
          disabled={!allFilled || checkoutLoading}
          className={`w-full py-3 rounded-full font-label-md text-label-md font-bold transition-all duration-150 ${
            allFilled && !checkoutLoading
              ? 'bg-primary text-on-primary hover:opacity-90 cursor-pointer'
              : 'bg-[#252525] text-[#606060] cursor-not-allowed'
          }`}
        >
          {checkoutLoading ? 'Preparing checkout…' : 'Continue to Checkout'}
        </button>
      )}

      {/* Skip — always visible so user can exit seat selection at any point */}
      <button
        onClick={onContinue}
        disabled={checkoutLoading}
        className={`w-full mt-3 py-2 text-center font-label-sm text-label-sm transition-colors ${
          checkoutLoading
            ? 'text-[#606060] cursor-not-allowed'
            : 'text-outline hover:text-primary'
        }`}
      >
        Skip seat selection · go to checkout
      </button>

      {checkoutError && (
        <div className="mt-4 p-3 bg-error/20 border border-error rounded-xl text-error">
          <p className="font-label-sm text-label-sm">{checkoutError}</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SeatSelectionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { flight, inboundFlight, searchCriteria, passengers, contact, backUrl } = location.state || {};

  const adults   = parseInt(searchCriteria?.passengers?.adults   ?? 1);
  const children = parseInt(searchCriteria?.passengers?.children ?? 0);
  const totalPassengers = Math.max(adults + children, 1);

  // Build the flat segment list once (stable after mount)
  const allSegments = flight ? buildAllSegments(flight, inboundFlight) : [];

  // selectedSeats: { [segmentKey]: Array(totalPassengers) of seat|null }
  const [selectedSeats, setSelectedSeats] = useState(() =>
    Object.fromEntries(allSegments.map((s) => [s.key, Array(totalPassengers).fill(null)]))
  );

  const [activeSegmentIdx, setActiveSegmentIdx] = useState(0);
  const [activePassenger, setActivePassenger]   = useState(0);
  const [cityMap, setCityMap]                   = useState({});
  const [checkoutLoading, setCheckoutLoading]   = useState(false);
  const [checkoutError,   setCheckoutError]     = useState(null);

  useEffect(() => {
    if (!flight) navigate(backUrl || '/flights', { replace: true });
  }, [flight, navigate, backUrl]);

  // Resolve city names for all IATA codes used in the segments
  useEffect(() => {
    if (!flight) return;
    const segs = buildAllSegments(flight, inboundFlight || null);
    const codes = [...new Set(segs.flatMap((s) => [s.origin, s.destination]))];
    Promise.all(codes.map((c) => getAirport(c)))
      .then((results) => {
        const map = {};
        codes.forEach((code, i) => { if (results[i]?.city) map[code] = results[i].city; });
        setCityMap(map);
      })
      .catch(() => {});
  }, [flight, inboundFlight]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!flight) return null;

  const activeSegment = allSegments[activeSegmentIdx];
  const isLastSegment = activeSegmentIdx === allSegments.length - 1;
  const currentSeats  = selectedSeats[activeSegment?.key] || [];
  const currentColor  = P_COLORS[activePassenger % P_COLORS.length];

  // Count seats selected for the active segment (for per-segment header)
  const activeSegFilled = currentSeats.filter(Boolean).length;

  const handleSeatSelect = (segKey, pIdx, seat) => {
    setSelectedSeats((prev) => {
      const segArr = [...(prev[segKey] || Array(totalPassengers).fill(null))];
      if (seat) {
        // Prevent two passengers from taking the same seat on the same segment
        const clash = segArr.findIndex((s) => s?.id === seat.id);
        if (clash !== -1 && clash !== pIdx) segArr[clash] = null;
      }
      segArr[pIdx] = seat;
      return { ...prev, [segKey]: segArr };
    });
  };

  const handlePassengerClick = (pIdx, segIdx) => {
    setActivePassenger(pIdx);
    if (segIdx !== undefined) setActiveSegmentIdx(segIdx);
  };

  const handleNext = () => {
    setActiveSegmentIdx((i) => Math.min(i + 1, allSegments.length - 1));
    setActivePassenger(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinue = async () => {
    if (checkoutLoading) return;
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      const payload = buildDraftPayload({
        flight, inboundFlight, searchCriteria, passengers, contact, selectedSeats,
      });
      const draft = await createBookingDraft(payload);
      navigate(`/payment/${encodeURIComponent(draft.booking_id)}`, {
        state: { flight, inboundFlight, searchCriteria, passengers, contact, selectedSeats },
      });
    } catch (err) {
      setCheckoutError(err.message || 'Could not start checkout. Please try again.');
      setCheckoutLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/seat-choice', {
      state: { flight, inboundFlight, searchCriteria, passengers, contact, backUrl },
    });
  };

  return (
    <div className="dark">
      <Navbar />

      <main className="max-w-7xl mx-auto px-container-margin py-8">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-outline hover:text-primary transition-colors mb-6 font-label-md text-label-md"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>

        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-headline-lg text-headline-lg text-primary">Select Seats</h1>
          <p className="font-label-md text-label-md text-outline mt-1">
            {allSegments.length} flight{allSegments.length !== 1 ? 's' : ''}
            {' · '}
            {totalPassengers} passenger{totalPassengers !== 1 ? 's' : ''}
            {searchCriteria?.cabin_class && ` · ${searchCriteria.cabin_class}`}
          </p>
        </div>

        {/* ── Segment stepper ── */}
        <SegmentStepper
          segments={allSegments}
          activeIdx={activeSegmentIdx}
          selectedSeats={selectedSeats}
          totalPassengers={totalPassengers}
          cityMap={cityMap}
          onSegmentClick={(i) => { setActiveSegmentIdx(i); setActivePassenger(0); }}
        />

        {/* ── Passenger tabs (2+ passengers only) ── */}
        {totalPassengers > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {Array.from({ length: totalPassengers }, (_, i) => {
              const color = P_COLORS[i % P_COLORS.length];
              const seat = currentSeats[i];
              const isActive = activePassenger === i;
              return (
                <button
                  key={i}
                  onClick={() => setActivePassenger(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-150 whitespace-nowrap flex-shrink-0 font-label-md text-label-md ${
                    isActive
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-transparent border-[#2C2C2C] text-outline hover:border-[#4A4A4A] hover:text-primary'
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isActive ? '#141313' : color.bg }}
                  />
                  Passenger {i + 1}
                  {seat && (
                    <span className={`text-[10px] font-semibold ${isActive ? 'text-on-primary/60' : 'text-[#444]'}`}>
                      · {seat.id}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Selecting-for indicator ── */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: currentColor.bg }} />
          <p className="font-label-md text-label-md text-outline">
            Selecting seat for{' '}
            <span className="text-primary">Passenger {activePassenger + 1}</span>
            {' on '}
            <span className="text-primary">
              {airportLabel(activeSegment?.origin, cityMap)} → {airportLabel(activeSegment?.destination, cityMap)}
            </span>
            {' · '}
            <span className="text-[#555]">{activeSegment?.airline} {activeSegment?.flightNumber}</span>
            {currentSeats[activePassenger] && (
              <>
                {' · Current: '}
                <span className="text-primary">{currentSeats[activePassenger].id}</span>
                {' '}
                <span className="text-[#444]">({getSeatTypeLabel(currentSeats[activePassenger].type)})</span>
              </>
            )}
          </p>
        </div>

        {/* ── Main grid: SeatMap + Summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
          {/* Seat map — spans 2 of 3 columns */}
          <div className="lg:col-span-2">
            {/* Segment header above map */}
            <div className="flex items-center justify-between mb-4">
              <div>
                {activeSegment?.directionLabel && (
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">
                    {activeSegment.directionLabel}
                    {activeSegment.totalInFlight > 1 && ` · Leg ${activeSegment.segIndexInFlight + 1} of ${activeSegment.totalInFlight}`}
                  </span>
                )}
                <h2 className="font-headline-md text-headline-md text-primary mt-0.5">
                  {airportLabel(activeSegment?.origin, cityMap)} → {airportLabel(activeSegment?.destination, cityMap)}
                </h2>
                <p className="font-label-md text-label-md text-outline mt-0.5">
                  {activeSegment?.airline} {activeSegment?.flightNumber}
                  {activeSegment?.departureTime !== '—' && ` · ${activeSegment.departureTime}–${activeSegment.arrivalTime}`}
                  {activeSegment?.duration && ` · ${formatDuration(activeSegment.duration)}`}
                  {activeSegment?.aircraftName && (
                    <span className="text-[#444]"> · {activeSegment.aircraftName}</span>
                  )}
                </p>
              </div>
              {/* Per-segment mini progress */}
              <div className="text-right flex-shrink-0">
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest">Segment</p>
                <p className="font-headline-md text-headline-md text-primary tabular-nums">
                  {activeSegFilled}/{totalPassengers}
                </p>
              </div>
            </div>

            <SeatMap
              passengers={totalPassengers}
              selectedSeats={currentSeats}
              onSeatSelect={(pIdx, seat) => handleSeatSelect(activeSegment.key, pIdx, seat)}
              activePassenger={activePassenger}
            />

            {/* Next-segment convenience button below map */}
            {!isLastSegment && (
              <button
                onClick={handleNext}
                className="mt-4 w-full py-3 rounded-full border border-[#2C2C2C] text-outline hover:border-[#4A4A4A] hover:text-primary font-label-md text-label-md transition-colors flex items-center justify-center gap-2"
              >
                Next: {airportLabel(allSegments[activeSegmentIdx + 1]?.origin, cityMap)} → {airportLabel(allSegments[activeSegmentIdx + 1]?.destination, cityMap)}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            )}
          </div>

          {/* Summary panel — sticky */}
          <div className="lg:sticky lg:top-24">
            <SummaryPanel
              segments={allSegments}
              totalPassengers={totalPassengers}
              activePassenger={activePassenger}
              selectedSeats={selectedSeats}
              activeSegmentIdx={activeSegmentIdx}
              cityMap={cityMap}
              onPassengerClick={handlePassengerClick}
              onContinue={handleContinue}
              onNext={handleNext}
              isLastSegment={isLastSegment}
              checkoutLoading={checkoutLoading}
              checkoutError={checkoutError}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
