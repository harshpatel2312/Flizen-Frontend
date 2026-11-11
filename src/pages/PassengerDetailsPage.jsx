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
import { fetchProfile } from '../services/profileService';
import { offerMemoryKey, recallFlowState, rememberFlowState } from '../utils/bookingFlowMemory';
import PhoneInput from '../components/PhoneInput';
import SearchableDropdown from '../components/SearchableDropdown';
import { phoneError } from '../utils/phone';
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
                  className="group w-full px-4 py-3 text-left hover:bg-[#2C2C2C] transition-colors border-b border-[#2C2C2C] last:border-b-0 font-body-md text-primary group-hover:text-secondary"
                >
                  <span className="group-hover:text-secondary transition-colors">{lbl}</span>
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
// Specialised input components
// ─────────────────────────────────────────────────────────────────────────────

function PassportNumberInput({ value, onChange, onBlur, error }) {
  const [show, setShow] = useState(false);
  const handleChange = (e) => {
    const clean = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 9);
    onChange(clean);
  };
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>Passport Number</FieldLabel>
      <div
        className={`flex items-center bg-[#1F1F1F] rounded-full h-12 focus-within:ring-2 transition-all
          ${error ? 'ring-2 ring-error-container' : 'focus-within:ring-white'}`}
      >
        <input
          className="flex-1 bg-transparent h-full px-5 text-primary font-body-md focus:outline-none placeholder:text-[#8e9192] tracking-widest"
          placeholder="e.g. A12345678"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          maxLength={9}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="pr-4 text-outline hover:text-primary transition-colors"
          tabIndex={-1}
        >
          <span className="material-symbols-outlined text-[20px] leading-none">
            {show ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
      {error && <p className="text-error-container font-label-sm text-label-sm px-2">{error}</p>}
    </div>
  );
}

function PassportExpiryInput({ value, onChange, onBlur, error }) {
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    onChange(formatted);
  };
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>Passport Expiry</FieldLabel>
      <div
        className={`flex items-center bg-[#1F1F1F] rounded-full h-12 focus-within:ring-2 transition-all
          ${error ? 'ring-2 ring-error-container' : 'focus-within:ring-white'}`}
      >
        <input
          className="flex-1 bg-transparent h-full px-5 text-primary font-body-md focus:outline-none placeholder:text-[#8e9192]"
          placeholder="MM/YYYY"
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          maxLength={7}
          inputMode="numeric"
        />
      </div>
      {error && <p className="text-error-container font-label-sm text-label-sm px-2">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown option lists
// ─────────────────────────────────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { value: 'male',    label: 'Male' },
  { value: 'female',  label: 'Female' },
  { value: 'unknown', label: 'Prefer not to say' },
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

function TravelerForm({ globalNum, type, data, errors, onChange, onBlur, passportRequired }) {
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
        <SearchableDropdown
          label="Nationality"
          placeholder="Select country"
          searchPlaceholder="Search country"
          options={COUNTRIES}
          value={data.nationality}
          onChange={(val) => onChange('nationality', val)}
        />
        {type !== 'infant' && passportRequired && (
          <>
            <PassportNumberInput
              value={data.passport}
              onChange={(val) => onChange('passport', val)}
              onBlur={() => onBlur('passport', data.passport)}
              error={errors.passport}
            />
            <CapsuleDropdown
              label="Issuing Country"
              placeholder="Select country"
              options={COUNTRIES}
              value={data.passportIssuingCountry}
              onChange={(val) => onChange('passportIssuingCountry', val)}
              error={errors.passportIssuingCountry}
            />
            <PassportExpiryInput
              value={data.passportExpiry}
              onChange={(val) => onChange('passportExpiry', val)}
              onBlur={() => onBlur('passportExpiry', data.passportExpiry)}
              error={errors.passportExpiry}
            />
          </>
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

  const { flight, inboundFlight, searchCriteria, backUrl, passengers: savedPassengers, contact: savedContact } = location.state || {};

  const offerKey = offerMemoryKey(flight);
  const memoryKey = offerKey ? `passengers:${offerKey}` : null;
  const [remembered] = useState(() => recallFlowState(memoryKey));

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
    firstName:              isFirst ? (user?.displayName?.split(' ')[0] || '') : '',
    lastName:               isFirst ? (user?.displayName?.split(' ').slice(1).join(' ') || '') : '',
    dob:                    '',
    gender:                 '',
    nationality:            '',
    passport:               '',
    passportIssuingCountry: '',
    passportExpiry:         '',
  });

  const [passengers, setPassengers] = useState(() => {
    if (savedPassengers?.length === travelers.length) return savedPassengers;
    if (remembered?.passengers?.length === travelers.length) return remembered.passengers;
    return travelers.map((_, i) => blankPassenger(i === 0));
  });
  const [contact, setContact] = useState(
    savedContact ?? remembered?.contact ?? { email: user?.email || '', phone: '' }
  );
  const [errors, setErrors] = useState([]);
  const [contactErrors, setContactErrors] = useState({});
  const isRestored =
    savedPassengers?.length === travelers.length ||
    remembered?.passengers?.length === travelers.length;

  // Remember what's been entered so browser Back/Forward doesn't wipe the form.
  useEffect(() => {
    rememberFlowState(memoryKey, { passengers, contact });
  }, [memoryKey, passengers, contact]);

  // ── pre-populate primary passenger from saved profile ──────────────────────
  // Skip if we're restoring data from a back-navigation (savedPassengers already filled)
  useEffect(() => {
    if (!user) return;
    if (isRestored) return; // already restored
    fetchProfile(user)
      .then((profile) => {
        if (!profile) return;
        const { personal = {}, contact: pc = {}, passport: pp = {} } = profile;
        setPassengers((prev) => {
          const next = [...prev];
          next[0] = {
            ...next[0],
            ...(personal.firstName   && { firstName:               personal.firstName }),
            ...(personal.lastName    && { lastName:                personal.lastName }),
            ...(personal.dob         && { dob:                     personal.dob }),
            ...(personal.gender      && { gender:                  personal.gender }),
            ...(personal.nationality && { nationality:             personal.nationality }),
            ...(pp.number            && { passport:               pp.number }),
            ...(pp.country           && { passportIssuingCountry: pp.country }),
            ...(pp.expiry            && { passportExpiry:         pp.expiry }),
          };
          return next;
        });
        setContact((prev) => ({
          ...prev,
          ...(pc.email && { email: pc.email }),
          ...(pc.phone && { phone: pc.phone }),
        }));
      })
      .catch(() => {}); // silently ignore — user may not have a profile yet
  }, [user]);

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

  const validatePassengerField = (idx, field, val) => {
    let error;
    if (field === 'passport') {
      if (!val.trim()) error = 'Required';
      else if (!/^[A-Z0-9]{6,9}$/.test(val)) error = '6–9 uppercase letters & digits';
    } else if (field === 'passportExpiry') {
      if (!val.trim()) error = 'Required';
      else if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(val)) error = 'Use MM/YYYY format';
      else {
        const [mm, yyyy] = val.split('/');
        const expiry = new Date(parseInt(yyyy), parseInt(mm) - 1, 1);
        const now = new Date(); now.setDate(1); now.setHours(0, 0, 0, 0);
        if (expiry < now) error = 'Passport has expired';
      }
    }
    if (error !== undefined) {
      setErrors((prev) => {
        const next = [...prev];
        next[idx] = { ...(next[idx] || {}), [field]: error };
        return next;
      });
    }
  };

  const validateContactField = (field, val) => {
    let error;
    if (field === 'email') {
      if (!val.trim()) error = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim())) error = 'Invalid email address';
    } else if (field === 'phone') {
      error = phoneError(val);
    }
    if (error !== undefined) {
      setContactErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const validate = () => {
    const pErrs = passengers.map((p, idx) => {
      const e = {};
      if (!p.firstName.trim()) e.firstName = 'Required';
      if (!p.lastName.trim())  e.lastName  = 'Required';
      if (!p.dob)              e.dob       = 'Required';
      if (!p.gender)           e.gender    = 'Required';
      if ((flight.passportRequired || inboundFlight?.passportRequired) && travelers[idx]?.type !== 'infant') {
        if (!p.passport.trim()) {
          e.passport = 'Required';
        } else if (!/^[A-Z0-9]{6,9}$/.test(p.passport)) {
          e.passport = '6–9 uppercase letters & digits';
        }
        if (!p.passportIssuingCountry) e.passportIssuingCountry = 'Required';
        if (!p.passportExpiry.trim()) {
          e.passportExpiry = 'Required';
        } else if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(p.passportExpiry)) {
          e.passportExpiry = 'Use MM/YYYY format';
        } else {
          const [mm, yyyy] = p.passportExpiry.split('/');
          const expiry = new Date(parseInt(yyyy), parseInt(mm) - 1, 1);
          const now = new Date(); now.setDate(1); now.setHours(0, 0, 0, 0);
          if (expiry < now) e.passportExpiry = 'Passport has expired';
        }
      }
      return e;
    });
    const cErrs = {};
    if (!contact.email.trim()) {
      cErrs.email = 'Required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email.trim())) {
      cErrs.email = 'Invalid email address';
    }
    const phoneErr = phoneError(contact.phone);
    if (phoneErr) cErrs.phone = phoneErr;
    setErrors(pErrs);
    setContactErrors(cErrs);
    return pErrs.every((e) => Object.keys(e).length === 0) && Object.keys(cErrs).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    navigate('/seat-choice', { state: { flight, inboundFlight, searchCriteria, passengers, contact, backUrl } });
  };

  const isRoundTrip = !!inboundFlight;

  const handleBack = () => {
    navigate(backUrl || '/flights', {
      state: isRoundTrip
        ? {
            restoreInbound: {
              outboundFlight: flight,
              selectedFlight: inboundFlight,
            },
          }
        : undefined,
    });
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
            onClick={handleBack}
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
                onBlur={(field, val) => validatePassengerField(idx, field, val)}
                passportRequired={!!(flight.passportRequired || inboundFlight?.passportRequired)}
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
                  onBlur={() => validateContactField('email', contact.email)}
                  error={contactErrors.email}
                />
                <PhoneInput
                  value={contact.phone}
                  onChange={(val) => updateContact('phone', val)}
                  onBlur={() => validateContactField('phone', contact.phone)}
                  error={contactErrors.phone}
                />
              </div>
            </section>

          </div>

          {/* Right: Sticky flight details panel ───────────────────────────── */}
          <div className="lg:col-span-4">
            <FlightDetailsPanel
              flight={flight}
              inboundFlight={inboundFlight}
              searchCriteria={searchCriteria}
              onContinue={handleContinue}
            />
          </div>

        </div>
      </main>
    </div>
  );
}
