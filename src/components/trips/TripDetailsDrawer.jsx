// src/components/trips/TripDetailsDrawer.jsx
// Trip Details for My Trips, in the shared right-side drawer (same component
// and behavior as the Find Your Flights filters). Loads
// GET /api/bookings/:id/details, refreshes while the booking is still being
// confirmed or refunded, and reports changes back to the page.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SideDrawer from '../SideDrawer';
import { fetchBookingDetails } from '../../services/bookingService';
import { pillClassFor } from '../../utils/bookingStatus';
import { tripStatus } from '../../utils/trips';
import {
  ActivitySection,
  AdditionalInfoSection,
  ItinerarySection,
  ManageSection,
  OverviewSection,
  PaymentSection,
  ReferenceSection,
  TravellersSection,
  hasManageOptions,
  isSettling,
} from './TripDetailsSections';

const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = 24; // ~2 minutes

function useTripDetails(bookingId, onUpdate) {
  // Keyed by booking id so switching trips never shows the previous trip's data.
  const [state, setState] = useState({ id: null, details: null, error: null });
  const [reloadKey, setReloadKey] = useState(0);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!bookingId) return undefined;
    let cancelled = false;
    let timer = null;
    let polls = 0;

    async function load() {
      try {
        const d = await fetchBookingDetails(bookingId);
        if (cancelled) return;
        setState({ id: bookingId, details: d, error: null });
        onUpdateRef.current?.(d);
        if (isSettling(d) && polls < MAX_POLLS) {
          polls += 1;
          timer = setTimeout(load, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        const error = { message: err.message || 'Could not load trip details.', status: err.status };
        // Keep showing loaded details if a background refresh fails.
        setState((s) => (s.id === bookingId && s.details ? s : { id: bookingId, details: null, error }));
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [bookingId, reloadKey]);

  const current = state.id === bookingId ? state : { id: bookingId, details: null, error: null };
  const retry = () => {
    setState({ id: bookingId, details: null, error: null });
    setReloadKey((k) => k + 1);
  };
  return { ...current, retry };
}

export default function TripDetailsDrawer({ bookingId, cityMap, onClose, onUpdate }) {
  const isOpen = Boolean(bookingId);
  // Keep the last trip on screen while the drawer slides closed.
  const [shownId, setShownId] = useState(bookingId);
  if (bookingId && bookingId !== shownId) setShownId(bookingId);

  const { details, error, retry } = useTripDetails(shownId, onUpdate);
  const status = details ? tripStatus(details) : null;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Trip Details"
      headerExtra={status && (
        <span className={`px-3 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${pillClassFor(status.tone)}`}>
          {status.label}
        </span>
      )}
      headerClassName="px-6 py-5 lg:px-10"
      bodyClassName="px-6 py-6 lg:px-10 lg:py-8 space-y-8"
      // Half the screen on desktop (filters keep the narrow default), full width on phones.
      widthClass="md:w-3/4 lg:w-1/2"
    >
      {!details && !error && shownId && (
        <div className="flex flex-col items-center gap-4 py-16" aria-busy="true">
          <div className="animate-pulse">
            <span className="material-symbols-outlined text-5xl text-primary">flight_takeoff</span>
          </div>
          <p className="text-on-surface-variant font-label-sm">Loading trip details…</p>
        </div>
      )}

      {error && !details && (
        <div className="flex flex-col items-center text-center gap-4 py-12" role="alert">
          <span className="material-symbols-outlined text-5xl text-error">
            {error.status === 401 ? 'lock' : 'error'}
          </span>
          <div>
            <p className="text-primary font-label-lg text-label-lg">
              {error.status === 401 ? 'Session expired' : 'Couldn\u2019t load this trip'}
            </p>
            <p className="text-on-surface-variant text-sm mt-1">{error.message}</p>
          </div>
          {error.status === 401 ? (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold hover:opacity-90 transition-opacity"
            >
              Sign in again
            </Link>
          ) : (
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#2C2C2C] text-primary font-label-md text-label-md font-bold hover:border-[#4A4A4A] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Try again
            </button>
          )}
        </div>
      )}

      {details && (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
            <OverviewSection details={details} cityMap={cityMap} />
            <ReferenceSection details={details} className="rounded-xl bg-[#161616] border border-[#2C2C2C] p-5" />
          </div>
          <ItinerarySection details={details} cityMap={cityMap} />
          <TravellersSection details={details} />
          <div className={`pt-6 border-t border-[#2C2C2C] grid gap-8 ${hasManageOptions(details) ? 'xl:grid-cols-2' : ''}`}>
            <PaymentSection details={details} className={hasManageOptions(details) ? '' : 'max-w-lg'} />
            <ManageSection
              details={details}
              className="pt-6 border-t border-[#2C2C2C] xl:pt-0 xl:border-t-0 xl:pl-8 xl:border-l"
            />
          </div>
          <ActivitySection details={details} />
          <AdditionalInfoSection details={details} />
        </>
      )}
    </SideDrawer>
  );
}
