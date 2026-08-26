// src/components/FlightHistory.jsx
// ---------------------------------------------------------------------------
// Displays the signed-in user's trip history.
// Fetches GET /api/bookings; UI kept identical to the previous static version.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listBookings } from '../services/bookingService';
import { displayFor, pillClassFor } from '../utils/bookingStatus';

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ShellHeader() {
  return (
    <div className="px-4 py-3.5 border-b border-[#2C2C2C]">
      <h3 className="font-label-lg text-label-lg text-white flex items-center gap-2">
        <span className="material-symbols-outlined">airplane_ticket</span>
        Recent Trips
      </h3>
    </div>
  );
}

export default function FlightHistory() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState(null); // null=loading, []=empty
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await listBookings();
        if (!cancelled) setBookings(data.bookings || []);
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err.message || 'Could not load your trips.');
          setBookings([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (bookings === null) {
    return (
      <section className="bg-[#121212] rounded-xl border border-[#2C2C2C] h-[500px] flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4 px-6">
          <div className="animate-spin">
            <span className="material-symbols-outlined text-5xl text-primary block">
              flight_takeoff
            </span>
          </div>
          <p className="text-[#888888] text-sm">Loading your trips…</p>
        </div>
      </section>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (errorMsg && bookings.length === 0) {
    return (
      <section className="bg-[#121212] rounded-xl border border-[#2C2C2C] h-[500px] flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4 px-6">
          <span className="material-symbols-outlined text-5xl text-error block">error</span>
          <div>
            <p className="text-white font-label-lg text-label-lg">Couldn&apos;t load your trips</p>
            <p className="text-[#888888] text-sm mt-1">{errorMsg}</p>
          </div>
        </div>
      </section>
    );
  }

  // ── Empty (preserved from the original design) ─────────────────────────
  if (bookings.length === 0) {
    return (
      <section className="bg-[#121212] rounded-xl border border-[#2C2C2C] h-[500px] flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4 px-6">
          <span className="material-symbols-outlined text-5xl text-[#2C2C2C] block">
            flight_takeoff
          </span>
          <div>
            <p className="text-white font-label-lg text-label-lg">No trips yet</p>
            <p className="text-[#888888] text-sm mt-1">
              Your next journey is just a few taps away.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ── List (unchanged card layout) ───────────────────────────────────────
  return (
    <section className="bg-[#121212] rounded-xl border border-[#2C2C2C] overflow-hidden">
      <ShellHeader />
      <div className="max-h-[450px] overflow-y-auto">
        {bookings.map((bk) => {
          const display = displayFor(bk);
          const fs = bk.flight_summary || {};
          const from = fs.from_airport || '—';
          const to   = fs.to_airport   || '—';
          const airline = fs.airline   || '';
          const date = formatDate(fs.departure_date || bk.created_at);

          return (
            <Link
              key={bk.booking_id}
              to={`/booking/${encodeURIComponent(bk.booking_id)}`}
              className="block px-4 py-3 border-b border-[#2C2C2C] hover:bg-[#1F1F1F] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-28 flex-shrink-0">
                  <p className="text-white text-xl font-semibold leading-tight tracking-wide">
                    {from}
                  </p>
                  <p className="text-[#AAAAAA] text-xs mt-1 leading-tight whitespace-nowrap">
                    {airline}
                  </p>
                </div>
                <div className="flex-1 flex items-center min-w-0 max-w-[140px] mx-auto">
                  <div className="flex-1 h-px bg-[#2E2E2E]" />
                  <span
                    className="material-symbols-outlined text-[14px] text-primary leading-none flex-shrink-0 mx-1.5"
                    style={{ verticalAlign: 'middle' }}
                  >
                    flight_takeoff
                  </span>
                  <div className="flex-1 h-px bg-[#2E2E2E]" />
                </div>
                <div className="w-52 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <p className="text-white text-xl font-semibold leading-tight tracking-wide">
                      {to}
                    </p>
                    <span className="text-[#3C3C3C] text-sm select-none leading-none px-0.5">|</span>
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-medium whitespace-nowrap min-w-[80px] text-center ${pillClassFor(display.tone)}`}
                    >
                      {display.label}
                    </span>
                  </div>
                  <p className="text-[#AAAAAA] text-xs mt-1 leading-tight whitespace-nowrap">
                    {date}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

