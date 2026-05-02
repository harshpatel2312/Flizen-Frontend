// src/pages/PassengerDetailsPage.jsx
// ---------------------------------------------------------------------------
// Passenger details form — step between flight selection and payment.
// Uses the same Navbar, auth session, and FlightDetailsPanel as the rest of
// the app. Flight + searchCriteria are passed via React Router location.state.
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FlightDetailsPanel from '../components/FlightDetailsPanel';
import DatePickerDOB from '../components/DatePickerDOB';
import { useAuth } from '../context/AuthContext';
import '../styles/AirportAutocomplete.css';

// ─────────────────────────────────────────────────────────────────────────────
// Page-local reusable field components (capsule style)
// ─────────────────────────────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return (
    <label className="font-label-sm text-label-sm text-outline uppercase tracking-widest">
      {children}
    </label>
  );
}

function CapsuleInput({ label, error, ...props }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <FieldLabel>{label}</FieldLabel>}
      <div
        className={`flex items-center bg-[#1F1F1F] rounded-full h-12 focus-within:ring-2 transition-all
          ${error ? 'ring-2 ring-error-container' : 'focus-within:ring-white'}`}
      >
        <input
          className="flex-1 bg-transparent h-full px-5 text-primary font-body-md focus:outline-none placeholder:text-[#8e9192]"
          {...props}
        />
      </div>
      {error && <p className="text-error-container font-label-sm text-label-sm px-2">{error}</p>}
    </div>
  );
}

function CapsuleDropdown({ label, error, options, placeholder, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const selected = options.find((o) => (o.value ?? o) === value);
  const displayLabel = selected ? (selected.label ?? selected) : null;

  return (
    <div className="flex flex-col gap-2">
      {label && <FieldLabel>{label}</FieldLabel>}
      <div ref={ref} className="relative">
        <div
          onClick={() => setIsOpen((o) => !o)}
          className={`flex items-center bg-[#1F1F1F] rounded-full h-12 px-5 cursor-pointer hover:bg-surface-bright transition-all
            ${error ? 'ring-2 ring-error-container' : isOpen ? 'ring-2 ring-white' : ''}`}
        >
          <span className={`flex-1 font-body-md text-sm ${displayLabel ? 'text-primary' : 'text-[#8e9192]'}`}>
            {displayLabel || placeholder}
          </span>
          <span className="material-symbols-outlined text-outline text-[20px]">expand_more</span>
        </div>
        {isOpen && (
          <div className="airport-dropdown absolute top-full left-0 right-0 mt-2 bg-[#1F1F1F] rounded-lg border border-[#2C2C2C] shadow-xl z-50 max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const val = opt.value ?? opt;
              const lbl = opt.label ?? opt;
              return (
                <button
                  key={val}
                  onClick={() => { onChange(val); setIsOpen(false); }}
                  className="w-full px-4 py-3 text-left hover:bg-[#2C2C2C] transition-colors border-b border-[#2C2C2C] last:border-b-0 font-body-md text-primary"
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {error && <p className="text-error-container font-label-sm text-label-sm px-2">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown option lists
// ─────────────────────────────────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'unspecified', label: 'Unspecified' },
];

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Bangladesh',
  'Belgium','Brazil','Canada','Chile','China','Colombia','Croatia','Czech Republic',
  'Denmark','Egypt','Ethiopia','Finland','France','Germany','Ghana','Greece',
  'Hungary','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Japan',
  'Jordan','Kenya','Malaysia','Mexico','Morocco','Nepal','Netherlands','New Zealand',
  'Nigeria','Norway','Pakistan','Peru','Philippines','Poland','Portugal','Romania',
  'Russia','Saudi Arabia','Singapore','South Africa','South Korea','Spain',
  'Sri Lanka','Sweden','Switzerland','Taiwan','Thailand','Turkey','UAE',
  'Uganda','Ukraine','United Kingdom','United States','Vietnam','Zimbabwe',
];

// ─────────────────────────────────────────────────────────────────────────────
// TravelerForm — one card per passenger
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_LABEL = { adult: 'Adult', child: 'Child', infant: 'Infant' };
const TYPE_SUBTITLE = {
  adult:  'Name must match your government-issued ID exactly.',
  child:  'Children are 2–11 years old at time of travel.',
  infant: 'Infants are under 2 years old at time of travel.',
};

function TravelerForm({ globalNum, type, data, errors, onChange }) {
  return (
    <section className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-6 lg:p-8 flex flex-col gap-6">
      <div className="border-b border-[#2C2C2C] pb-4">
        <h2 className="font-headline-md text-headline-md text-primary">
          Traveler {globalNum} ({TYPE_LABEL[type]})
        </h2>
        <p className="font-label-md text-label-md text-on-surface-variant mt-1">
          {TYPE_SUBTITLE[type]}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CapsuleInput
          label="First Name"
          placeholder="e.g. Jane"
          value={data.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          error={errors.firstName}
        />
        <CapsuleInput
          label="Last Name"
          placeholder="e.g. Doe"
          value={data.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          error={errors.lastName}
        />
        <div className="flex flex-col gap-2">
          <FieldLabel>Date of Birth</FieldLabel>
          <DatePickerDOB
            value={data.dob}
            onChange={(val) => onChange('dob', val)}
            error={errors.dob}
          />
        </div>
        <CapsuleDropdown
          label="Gender"
          placeholder="Select gender"
          options={GENDER_OPTIONS}
          value={data.gender}
          onChange={(val) => onChange('gender', val)}
          error={errors.gender}
        />
        <CapsuleDropdown
          label="Nationality"
          placeholder="Select country"
          options={COUNTRIES}
          value={data.nationality}
          onChange={(val) => onChange('nationality', val)}
        />
        {type !== 'infant' && (
          <CapsuleInput
            label="Passport Number"
            placeholder="Optional for domestic"
            value={data.passport}
            onChange={(e) => onChange('passport', e.target.value)}
          />
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────
export default function PassengerDetailsPage() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const { flight, searchCriteria, backUrl } = location.state || {};

  // Build ordered traveler list from search criteria counts
  const travelers = (() => {
    const a = parseInt(searchCriteria?.passengers?.adults   ?? 1);
    const c = parseInt(searchCriteria?.passengers?.children ?? 0);
    const i = parseInt(searchCriteria?.passengers?.infants  ?? 0);
    return [
      ...Array.from({ length: a }, (_, n) => ({ type: 'adult',  seq: n + 1 })),
      ...Array.from({ length: c }, (_, n) => ({ type: 'child',  seq: n + 1 })),
      ...Array.from({ length: i }, (_, n) => ({ type: 'infant', seq: n + 1 })),
    ];
  })();

  const blankPassenger = (isFirst) => ({
    firstName:   isFirst ? (user?.displayName?.split(' ')[0] || '') : '',
    lastName:    isFirst ? (user?.displayName?.split(' ').slice(1).join(' ') || '') : '',
    dob:         '',
    gender:      '',
    nationality: '',
    passport:    '',
  });

  const [passengers, setPassengers] = useState(() =>
    travelers.map((_, i) => blankPassenger(i === 0))
  );
  const [contact, setContact] = useState({ email: user?.email || '', phone: '' });
  const [errors, setErrors] = useState([]);
  const [contactErrors, setContactErrors] = useState({});

  const updatePassenger = (idx, field, val) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
    setErrors((prev) => {
      const next = [...prev];
      if (next[idx]) next[idx] = { ...next[idx], [field]: undefined };
      return next;
    });
  };

  const updateContact = (field, val) => {
    setContact((prev) => ({ ...prev, [field]: val }));
    if (contactErrors[field]) setContactErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const pErrs = passengers.map((p) => {
      const e = {};
      if (!p.firstName.trim()) e.firstName = 'Required';
      if (!p.lastName.trim())  e.lastName  = 'Required';
      if (!p.dob)              e.dob       = 'Required';
      if (!p.gender)           e.gender    = 'Required';
      return e;
    });
    const cErrs = {};
    if (!contact.email.trim()) cErrs.email = 'Required';
    setErrors(pErrs);
    setContactErrors(cErrs);
    return pErrs.every((e) => Object.keys(e).length === 0) && Object.keys(cErrs).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    navigate('/payment', { state: { flight, searchCriteria, passengers, contact } });
  };

  // ── no flight guard ───────────────────────────────────────────────────────
  if (!flight) {
    return (
      <div className="dark">
        <Navbar />
        <main className="max-w-7xl mx-auto px-container-margin py-16 flex flex-col items-center gap-6">
          <span className="material-symbols-outlined text-5xl text-[#2C2C2C]">flight_takeoff</span>
          <p className="text-on-surface-variant font-body-md">No flight selected.</p>
          <Link
            to="/dashboard"
            className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-label-md font-bold hover:opacity-90 transition-opacity"
          >
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="dark">
      <Navbar />

      <main className="max-w-7xl mx-auto px-container-margin py-8 flex flex-col gap-section-gap">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate(backUrl || -1)}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md w-fit"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to flights
          </button>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">Passenger Details</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
              Tell us who's flying before we finalize your trip.
            </p>
          </div>
        </div>

        {/* ── Layout grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: Forms ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            {/* One card per traveler */}
            {travelers.map((t, idx) => (
              <TravelerForm
                key={idx}
                globalNum={idx + 1}
                type={t.type}
                data={passengers[idx]}
                errors={errors[idx] || {}}
                onChange={(field, val) => updatePassenger(idx, field, val)}
              />
            ))}

            {/* Contact information */}
            <section className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-6 lg:p-8 flex flex-col gap-6">
              <div className="border-b border-[#2C2C2C] pb-4">
                <h2 className="font-headline-md text-headline-md text-primary">Contact Information</h2>
                <p className="font-label-md text-label-md text-on-surface-variant mt-1">
                  We'll send booking updates and flight alerts here.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CapsuleInput
                  label="Email Address"
                  type="email"
                  placeholder="jane.doe@example.com"
                  value={contact.email}
                  onChange={(e) => updateContact('email', e.target.value)}
                  error={contactErrors.email}
                />
                <CapsuleInput
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={contact.phone}
                  onChange={(e) => updateContact('phone', e.target.value)}
                />
              </div>
            </section>

          </div>

          {/* Right: Sticky flight details panel ───────────────────────────── */}
          <div className="lg:col-span-4">
            <FlightDetailsPanel
              flight={flight}
              searchCriteria={searchCriteria}
              onContinue={handleContinue}
            />
          </div>

        </div>
      </main>
    </div>
  );
}
