// src/pages/ProfilePage.jsx
// ---------------------------------------------------------------------------
// User profile page — view and edit personal info, travel preferences, and
// travel documents. Follows the same layout and design system as the dashboard
// and PassengerDetailsPage.
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AirportAutocomplete from '../components/AirportAutocomplete';
import DatePickerDOB from '../components/DatePickerDOB';
import { useAuth } from '../context/AuthContext';
import { fetchProfile, saveProfile } from '../services/profileService';

// ─────────────────────────────────────────────────────────────────────────────
// Page-local reusable primitives (same style as PassengerDetailsPage)
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

function PassportNumberField({ value, onChange, error }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>Passport Number</FieldLabel>
      <div
        className={`flex items-center bg-[#1F1F1F] rounded-full h-12 focus-within:ring-2 transition-all
          ${error ? 'ring-2 ring-error-container' : 'focus-within:ring-white'}`}
      >
        <input
          className="flex-1 bg-transparent h-full px-5 text-primary font-body-md focus:outline-none placeholder:text-[#8e9192] tracking-widest"
          type={show ? 'text' : 'password'}
          placeholder="e.g. A1234567"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9))}
          autoComplete="off"
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
// Static option lists
// ─────────────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Bahrain','Bangladesh','Belarus','Belgium','Brazil','Canada',
  'Chile','China','Colombia','Croatia','Czech Republic','Denmark','Egypt',
  'Ethiopia','Finland','France','Germany','Ghana','Greece','Hungary','India',
  'Indonesia','Iran','Iraq','Ireland','Israel','Italy','Japan','Jordan','Kenya',
  'Malaysia','Mexico','Morocco','Nepal','Netherlands','New Zealand','Nigeria',
  'Norway','Pakistan','Peru','Philippines','Poland','Portugal','Romania',
  'Russia','Saudi Arabia','Singapore','South Africa','South Korea','Spain',
  'Sri Lanka','Sweden','Switzerland','Taiwan','Thailand','Turkey','UAE',
  'Uganda','Ukraine','United Kingdom','United States','Vietnam','Zimbabwe',
];

const GENDERS = [
  { value: 'male',    label: 'Male' },
  { value: 'female',  label: 'Female' },
  { value: 'unknown', label: 'Prefer not to say' },
];

const CABIN_CLASSES = ['Economy', 'Premium Economy', 'Business', 'First'];

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
];

const SEAT_PREFS = ['No preference', 'Window', 'Middle', 'Aisle'];

const MEAL_PREFS = [
  'No preference', 'Standard', 'Vegetarian', 'Vegan', 'Kosher',
  'Halal', 'Gluten-free', 'Low-calorie', 'Low-sodium',
];

// ─────────────────────────────────────────────────────────────────────────────
// Section card wrapper
// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-6 lg:p-8 flex flex-col gap-6">
      <div className="border-b border-[#2C2C2C] pb-4">
        <h2 className="font-headline-md text-headline-md text-primary">{title}</h2>
        {subtitle && (
          <p className="font-label-md text-label-md text-on-surface-variant mt-1">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarUrl   = user?.photoURL || null;
  const initial     = displayName.charAt(0).toUpperCase();

  // ── form state ──────────────────────────────────────────────────────────────
  const [personal, setPersonal] = useState({
    firstName: user?.displayName?.split(' ')[0] || '',
    lastName:  user?.displayName?.split(' ').slice(1).join(' ') || '',
    dob:       '',
    gender:    '',
    nationality: '',
  });

  const [contact, setContact] = useState({
    email: user?.email || '',
    phone: '',
    country: '',
  });

  const [prefs, setPrefs] = useState({
    cabinClass:  'Economy',
    currency:    'USD',
    homeAirport: null,
    seatPref:    'No preference',
    mealPref:    'No preference',
  });

  const [passport, setPassport] = useState({
    number:  '',
    country: '',
    expiry:  '',
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState({});

  // ── load existing profile via backend ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    fetchProfile(user)
      .then((data) => {
        if (!data) return;
        if (data.personal)    setPersonal((p) => ({ ...p, ...data.personal }));
        if (data.contact)     setContact((p)  => ({ ...p, ...data.contact }));
        if (data.preferences) setPrefs((p)    => ({ ...p, ...data.preferences }));
        if (data.passport)    setPassport((p)  => ({ ...p, ...data.passport }));
      })
      .catch(() => {}); // silently ignore — user may have no profile yet
  }, [user]);

  // ── helpers ─────────────────────────────────────────────────────────────────
  const setP = (field, val) => setPersonal((p) => ({ ...p, [field]: val }));
  const setC = (field, val) => setContact((p)  => ({ ...p, [field]: val }));
  const setPr = (field, val) => setPrefs((p)   => ({ ...p, [field]: val }));
  const setPp = (field, val) => setPassport((p) => ({ ...p, [field]: val }));

  const validate = () => {
    const e = {};
    if (!personal.firstName.trim()) e.firstName = 'Required';
    if (!personal.lastName.trim())  e.lastName  = 'Required';
    if (!contact.email.trim()) {
      e.email = 'Required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email.trim())) {
      e.email = 'Invalid email address';
    }
    if (contact.phone.trim() && !/^\+?[\d\s\-().]{7,20}$/.test(contact.phone.trim())) {
      e.phone = 'Invalid phone number';
    }
    if (passport.number.trim() && !/^[A-Z0-9]{6,9}$/.test(passport.number)) {
      e.passportNumber = '6–9 uppercase letters & digits';
    }
    if (passport.expiry.trim()) {
      if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(passport.expiry)) {
        e.passportExpiry = 'Use MM/YYYY format';
      } else {
        const [mm, yyyy] = passport.expiry.split('/');
        const exp = new Date(parseInt(yyyy), parseInt(mm) - 1, 1);
        const now = new Date(); now.setDate(1); now.setHours(0, 0, 0, 0);
        if (exp < now) e.passportExpiry = 'Passport has expired';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!user) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveProfile(user, {
        personal,
        contact,
        preferences: prefs,
        passport,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="dark min-h-screen bg-background">
      <Navbar />

      <main className="max-w-[1600px] w-full mx-auto px-container-margin py-container-margin flex flex-col gap-container-margin">

        {/* Back link — full width, above the two-column grid */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-outline hover:text-primary font-label-md text-label-md transition-colors self-start"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Home
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-container-margin">

        {/* ── Left: Profile Summary ── */}
        <div className="lg:col-span-4 flex flex-col gap-container-margin">
          <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-6 flex flex-col items-center gap-4 text-center">
            {/* Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full border-2 border-[#2C2C2C] object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-zinc-700 border-2 border-[#2C2C2C] flex items-center justify-center text-white text-3xl font-semibold select-none">
                {initial}
              </div>
            )}

            <div>
              <p className="font-headline-md text-headline-md text-primary">{displayName}</p>
              <p className="font-label-md text-label-md text-outline mt-1">{user?.email}</p>
            </div>

            {/* Google badge */}
            {user?.providerData?.some((p) => p.providerId === 'google.com') && (
              <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2C2C2C] rounded-full px-4 py-1.5">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Google account connected</span>
              </div>
            )}
          </div>

        </div>

        {/* ── Right: Form sections ── */}
        <div className="lg:col-span-8 flex flex-col gap-container-margin">

          {/* Personal Information */}
          <SectionCard title="Personal Information" subtitle="Your name must match your government-issued ID.">
            <div className="grid grid-cols-2 gap-element-gap">
              <CapsuleInput
                label="First Name"
                placeholder="First name"
                value={personal.firstName}
                onChange={(e) => setP('firstName', e.target.value)}
                error={errors.firstName}
              />
              <CapsuleInput
                label="Last Name"
                placeholder="Last name"
                value={personal.lastName}
                onChange={(e) => setP('lastName', e.target.value)}
                error={errors.lastName}
              />
            </div>

            <div className="grid grid-cols-2 gap-element-gap">
              <div className="flex flex-col gap-2">
                <FieldLabel>Date of Birth</FieldLabel>
                <DatePickerDOB
                  value={personal.dob}
                  onChange={(val) => setP('dob', val)}
                  error={errors.dob}
                />
              </div>
              <CapsuleDropdown
                label="Gender"
                placeholder="Select gender"
                options={GENDERS}
                value={personal.gender}
                onChange={(val) => setP('gender', val)}
              />
            </div>

            <div className="grid grid-cols-2 gap-element-gap">
              <CapsuleDropdown
                label="Nationality"
                placeholder="Select nationality"
                options={COUNTRIES}
                value={personal.nationality}
                onChange={(val) => setP('nationality', val)}
              />
            </div>
          </SectionCard>

          {/* Contact Information */}
          <SectionCard title="Contact Information" subtitle="We'll send booking updates and flight alerts here.">
            <div className="grid grid-cols-2 gap-element-gap">
              <CapsuleInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={contact.email}
                onChange={(e) => setC('email', e.target.value)}
                error={errors.email}
              />
              <CapsuleInput
                label="Phone Number"
                type="tel"
                placeholder="+1 555 000 0000"
                value={contact.phone}
                onChange={(e) => setC('phone', e.target.value.replace(/[^0-9+\-\s().]/g, '').slice(0, 20))}
                error={errors.phone}
              />
            </div>
            <div className="grid grid-cols-2 gap-element-gap">
              <CapsuleDropdown
                label="Country / Region"
                placeholder="Select country"
                options={COUNTRIES}
                value={contact.country}
                onChange={(val) => setC('country', val)}
              />
            </div>
          </SectionCard>

          {/* Travel Preferences */}
          <SectionCard title="Travel Preferences" subtitle="Personalise your default search and booking experience.">
            <div className="grid grid-cols-2 gap-element-gap">
              <CapsuleDropdown
                label="Preferred Cabin Class"
                placeholder="Select cabin class"
                options={CABIN_CLASSES}
                value={prefs.cabinClass}
                onChange={(val) => setPr('cabinClass', val)}
              />
              <CapsuleDropdown
                label="Preferred Currency"
                placeholder="Select currency"
                options={CURRENCIES}
                value={prefs.currency}
                onChange={(val) => setPr('currency', val)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <FieldLabel>Home Airport</FieldLabel>
              <AirportAutocomplete
                placeholder="Search for your home airport"
                icon="home"
                value={prefs.homeAirport ? `${prefs.homeAirport.name} — ${prefs.homeAirport.city} (${prefs.homeAirport.iata})` : ''}
                onChange={(text) => { if (!text) setPr('homeAirport', null); }}
                onSelect={(airport) => setPr('homeAirport', airport)}
              />
            </div>

            <div className="grid grid-cols-2 gap-element-gap">
              <CapsuleDropdown
                label="Seat Preference"
                placeholder="Select seat"
                options={SEAT_PREFS}
                value={prefs.seatPref}
                onChange={(val) => setPr('seatPref', val)}
              />
              <CapsuleDropdown
                label="Meal Preference"
                placeholder="Select meal"
                options={MEAL_PREFS}
                value={prefs.mealPref}
                onChange={(val) => setPr('mealPref', val)}
              />
            </div>
          </SectionCard>

          {/* Travel Documents */}
          <SectionCard title="Travel Documents" subtitle="Required for international flights.">
            <div className="grid grid-cols-2 gap-element-gap">
              <PassportNumberField
                value={passport.number}
                onChange={(val) => setPp('number', val)}
                error={errors.passportNumber}
              />
              <CapsuleInput
                label="Expiry Date"
                placeholder="MM/YYYY"
                value={passport.expiry}
                onChange={(e) => {
                  let v = e.target.value.replace(/[^0-9/]/g, '');
                  if (v.length === 2 && !v.includes('/') && passport.expiry.length === 1) v += '/';
                  setPp('expiry', v.slice(0, 7));
                }}
                error={errors.passportExpiry}
              />
            </div>
            <div className="grid grid-cols-2 gap-element-gap">
              <CapsuleDropdown
                label="Issuing Country"
                placeholder="Select country"
                options={COUNTRIES}
                value={passport.country}
                onChange={(val) => setPp('country', val)}
              />
            </div>
          </SectionCard>

          {/* Save action */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-on-primary font-label-md text-label-md font-bold py-3 px-10 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                )}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              {saved && (
                <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[18px] text-green-400">check_circle</span>
                  <span>Changes saved</span>
                </div>
              )}
            </div>
            {saveError && (
              <p className="text-error-container font-label-sm text-label-sm">{saveError}</p>
            )}
          </div>

        </div>

        </div>
      </main>
    </div>
  );
}
