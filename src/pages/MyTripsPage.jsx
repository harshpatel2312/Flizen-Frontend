// src/pages/MyTripsPage.jsx
// ---------------------------------------------------------------------------
// My Trips: the signed-in user's bookings, grouped into Upcoming / Pending /
// Completed / Cancelled / Refunded, with a details panel for the selected trip.
//
// Routes: /trips and /trips/:bookingId (the selected trip is in the URL so it
// can be linked to, and so Back closes the details view on mobile).
// Data comes from the backend (GET /api/bookings and /api/bookings/:id/details),
// which reads Firestore and enforces ownership.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TripCard from '../components/trips/TripCard';
import TripDetailsPanel from '../components/trips/TripDetailsPanel';
import { useAuth } from '../context/AuthContext';
import { getAirport } from '../services/apiService';
import { listBookings } from '../services/bookingService';
import {
  ALL_SECTIONS,
  EMPTY_TAB,
  TRIP_TABS,
  tabCounts,
  tripsInCategories,
} from '../utils/trips';

const tabPill = (active) =>
  `inline-flex items-center gap-2 font-label-md text-label-md px-4 py-2 rounded-full transition-colors border whitespace-nowrap ${
    active
      ? 'bg-[#1F1F1F] text-primary border-primary'
      : 'bg-[#121212] text-on-surface-variant hover:bg-surface-variant border-[#2C2C2C]'
  }`;

export default function MyTripsPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const requestedTab = searchParams.get('tab');
  const tab = TRIP_TABS.some((t) => t.id === requestedTab) ? requestedTab : 'all';

  const [bookings, setBookings] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [cityMap, setCityMap] = useState({});

  // ── Load trips ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user) return undefined;
    let cancelled = false;
    listBookings()
      .then((data) => {
        if (cancelled) return;
        setBookings(data.bookings || []);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Could not load your trips.');
        setBookings((prev) => prev ?? []);
      });
    return () => { cancelled = true; };
  }, [user, authLoading, reloadKey]);

  // ── Resolve city names once per set of airport codes ────────────────────
  const airportCodesKey = useMemo(() => {
    const codes = new Set();
    for (const b of bookings || []) {
      const fs = b.flight_summary || {};
      [fs.from_airport, fs.to_airport, fs.return_from_airport, fs.return_to_airport]
        .filter(Boolean)
        .forEach((c) => codes.add(c));
    }
    return [...codes].sort().join(',');
  }, [bookings]);

  useEffect(() => {
    if (!airportCodesKey) return undefined;
    let cancelled = false;
    const codes = airportCodesKey.split(',');
    Promise.all(codes.map((c) => getAirport(c).catch(() => null))).then((results) => {
      if (cancelled) return;
      const map = {};
      codes.forEach((code, i) => { if (results[i]?.city) map[code] = results[i].city; });
      setCityMap(map);
    });
    return () => { cancelled = true; };
  }, [airportCodesKey]);

  // ── Selection & tabs ────────────────────────────────────────────────────
  const selectTrip = (id) => {
    // Replace while switching trips so Back leaves the page instead of
    // stepping through every trip that was viewed.
    navigate(`/trips/${encodeURIComponent(id)}${search}`, { replace: Boolean(bookingId) });
  };
  const closeTrip = () => navigate(`/trips${search}`);
  const changeTab = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'all') next.delete('tab');
    else next.set('tab', id);
    setSearchParams(next, { replace: true });
  };

  // Keep the list in sync when the details panel sees a newer status.
  const handleDetailsUpdate = useCallback((details) => {
    setBookings((list) => list?.map((b) => (
      b.booking_id === details.booking_id ? { ...b, ...details } : b
    )));
  }, []);

  const retry = () => {
    setError(null);
    setBookings(null);
    setReloadKey((k) => k + 1);
  };

  const counts = useMemo(() => tabCounts(bookings || []), [bookings]);
  const isLoading = bookings === null;
  const hasTrips = counts.all > 0;

  return (
    <div className="dark">
      <Navbar />
      <main className="max-w-7xl mx-auto px-container-margin py-8">
        {/* Header */}
        <header className={`${bookingId ? 'hidden lg:flex' : 'flex'} flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6`}>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">My Trips</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Your bookings, itineraries, and payments in one place.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="self-start sm:self-auto inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Book a flight
          </Link>
        </header>

        {/* Tabs */}
        {!isLoading && hasTrips && (
          <nav
            aria-label="Trip filters"
            className={`${bookingId ? 'hidden lg:flex' : 'flex'} gap-2 overflow-x-auto pb-1 mb-6`}
          >
            {TRIP_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => changeTab(t.id)}
                aria-pressed={tab === t.id}
                className={tabPill(tab === t.id)}
              >
                {t.label}
                <span className={`text-xs tabular-nums ${tab === t.id ? 'text-on-surface-variant' : 'text-outline'}`}>
                  {counts[t.id]}
                </span>
              </button>
            ))}
          </nav>
        )}

        {error && hasTrips && (
          <div className="mb-6 p-4 bg-error/20 border border-error rounded-xl text-error flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {error}
            </span>
            <button type="button" onClick={retry} className="font-label-md text-label-md underline">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
          {/* List */}
          <div className={`lg:col-span-2 flex-col gap-4 ${bookingId ? 'hidden lg:flex' : 'flex'}`}>
            {isLoading && <LoadingList />}

            {!isLoading && !hasTrips && error && (
              <StateCard
                icon="error"
                iconClass="text-error"
                title="Couldn't load your trips"
                text={error}
                action={(
                  <button
                    type="button"
                    onClick={retry}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#2C2C2C] text-primary font-label-md text-label-md font-bold hover:border-[#4A4A4A] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Try again
                  </button>
                )}
              />
            )}

            {!isLoading && !hasTrips && !error && (
              <StateCard
                icon="luggage"
                title="No trips yet"
                text="When you book a flight, your itinerary, payment, and booking status will appear here."
                action={(
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    Search flights
                  </Link>
                )}
              />
            )}

            {!isLoading && hasTrips && (
              tab === 'all' ? (
                ALL_SECTIONS.map((section) => {
                  const items = tripsInCategories(bookings, section.categories);
                  if (!items.length) return null;
                  return (
                    <section key={section.id} className="flex flex-col gap-4">
                      <h2 className="flex items-center gap-2 font-label-sm text-label-sm text-outline uppercase tracking-widest mt-2">
                        {section.title}
                        <span className="text-on-surface-variant">{items.length}</span>
                      </h2>
                      {items.map((b) => (
                        <TripCard
                          key={b.booking_id}
                          booking={b}
                          cityMap={cityMap}
                          isSelected={b.booking_id === bookingId}
                          onSelect={selectTrip}
                        />
                      ))}
                    </section>
                  );
                })
              ) : (
                <TabList
                  tab={tab}
                  items={tripsInCategories(bookings, [tab])}
                  cityMap={cityMap}
                  selectedId={bookingId}
                  onSelect={selectTrip}
                />
              )
            )}
          </div>

          {/* Details */}
          <div className={bookingId ? 'block' : 'hidden lg:block'}>
            <TripDetailsPanel
              bookingId={bookingId}
              cityMap={cityMap}
              onBack={closeTrip}
              onUpdate={handleDetailsUpdate}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function TabList({ tab, items, cityMap, selectedId, onSelect }) {
  if (!items.length) {
    const copy = EMPTY_TAB[tab];
    return <StateCard icon={copy.icon} title={copy.title} text={copy.text} compact />;
  }
  return items.map((b) => (
    <TripCard
      key={b.booking_id}
      booking={b}
      cityMap={cityMap}
      isSelected={b.booking_id === selectedId}
      onSelect={onSelect}
    />
  ));
}

function StateCard({ icon, iconClass = 'text-[#2C2C2C]', title, text, action, compact = false }) {
  return (
    <section
      className={`bg-[#121212] rounded-xl border border-[#2C2C2C] flex items-center justify-center ${compact ? 'py-16' : 'min-h-[420px]'}`}
    >
      <div className="text-center flex flex-col items-center gap-4 px-6 max-w-sm">
        <span className={`material-symbols-outlined text-5xl block ${iconClass}`}>{icon}</span>
        <div>
          <p className="text-white font-label-lg text-label-lg">{title}</p>
          <p className="text-[#888888] text-sm mt-1">{text}</p>
        </div>
        {action}
      </div>
    </section>
  );
}

function LoadingList() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading your trips">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-6 animate-pulse">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1F1F1F]" />
              <div className="space-y-2">
                <div className="h-3 w-28 rounded bg-[#1F1F1F]" />
                <div className="h-2.5 w-20 rounded bg-[#1F1F1F]" />
              </div>
            </div>
            <div className="h-5 w-20 rounded-full bg-[#1F1F1F]" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-6 w-28 rounded bg-[#1F1F1F]" />
            <div className="h-px flex-1 mx-6 bg-[#1F1F1F]" />
            <div className="h-6 w-28 rounded bg-[#1F1F1F]" />
          </div>
          <div className="mt-5 pt-4 border-t border-[#2C2C2C] flex justify-between">
            <div className="h-3 w-32 rounded bg-[#1F1F1F]" />
            <div className="h-3 w-16 rounded bg-[#1F1F1F]" />
          </div>
        </div>
      ))}
    </div>
  );
}
