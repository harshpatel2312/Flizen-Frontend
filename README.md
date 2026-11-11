# Flizen Frontend

React frontend for the Flizen flight booking platform: flight search, passenger details, seat selection, Stripe checkout, and booking status. Dark-mode UI built with Tailwind CSS and Material Design 3 tokens.

## Tech stack

React 18, React Router 7, Vite 5, Tailwind CSS 3, Firebase Auth, Stripe Elements (`@stripe/react-stripe-js`), `libphonenumber-js`, `country-flag-icons`.

## Structure

```
src/
  main.jsx                       # App entry point, router setup
  App.jsx                        # Dashboard layout (search form + recent trips)
  index.css                      # Global styles, custom scrollbar classes
  components/
    Navbar.jsx                   # Top navigation bar
    BookingPanel.jsx             # Flight search form (airports, dates, passengers, cabin class)
    AirportAutocomplete.jsx      # Airport search with backend-backed suggestions
    DatePickerField.jsx          # Calendar date picker with past-date validation
    DatePickerDOB.jsx            # Date-of-birth picker (past dates only)
    PassengerSelector.jsx        # Adults / children / infants selector
    CabinClassSelector.jsx       # Economy / Premium Economy / Business / First
    FlightListCard.jsx           # Flight offer card on the listing page
    FlightDetailsPanel.jsx       # Sticky side panel: segments, baggage, fare conditions, total
    FlightFilters.jsx            # Sort pills + Filter button
    FlightFilterPanel.jsx        # Slide-in filters: stops, price, airlines, time, duration
    RouteInfoHeader.jsx          # Route + date summary header
    FlightHistory.jsx            # Recent trips on the dashboard (GET /api/bookings)
    SeatMap.jsx                  # Visual seat map (local preferences only)
    PhoneInput.jsx               # Phone field with searchable country-code picker
    SearchableDropdown.jsx       # Capsule dropdown with search (e.g. Nationality)
    Sep.jsx                      # Inline " | " separator
    ProtectedRoute.jsx           # Auth guard, redirects signed-out users to /login
    auth/                        # AuthInput, AuthButton, GoogleIcon
  context/
    AuthContext.jsx              # Firebase auth state
  pages/
    LoginPage.jsx                # / and /login
    SignUpPage.jsx               # /signup
    FlightListingPage.jsx        # /flights
    PassengerDetailsPage.jsx     # /passengers
    SeatSelectionChoicePage.jsx  # /seat-choice (pick seats or skip to checkout)
    SeatSelectionPage.jsx        # /seats
    PaymentPage.jsx              # /payment/:bookingId (Stripe Payment Element)
    BookingResultPage.jsx        # /payment/:bookingId/processing and /booking/:bookingId
    ProfilePage.jsx              # /profile
  services/
    apiService.js                # Airport search / lookup
    flightService.js             # Flight search + offer transformation
    flightCache.js               # In-memory cache of search results
    bookingService.js            # Booking drafts, booking list / detail
    paymentService.js            # PaymentIntents, Stripe.js loader
    profileService.js            # GET / PUT /profile
    firebase.js                  # Firebase init (reads VITE_FIREBASE_* env vars)
    authService.js               # signInWithGoogle(), signOut()
  utils/
    flightUtils.js               # formatDuration, formatPrice, getStopsLabel, sortFlights, detectUserCurrency
    searchParamUtils.js          # URL search-param parsing
    bookingStatus.js             # Booking status labels / tones shared by result page and history
    bookingFlowMemory.js         # Short-lived Back/Forward memory for the booking flow
    phone.js                     # Phone parsing, formatting, validation (libphonenumber-js)
  styles/
    AirportAutocomplete.css      # Dropdown + scrollbar styles
  data/
    suggestedRoutes.js           # Static suggested routes
```

## Setup

```bash
npm install
```

Create `.env.local` (gitignored, never commit it):

| Variable                            | Purpose                                                 |
|-------------------------------------|---------------------------------------------------------|
| `VITE_API_BASE_URL`                 | Backend URL. Default `http://localhost:8000`.            |
| `VITE_STRIPE_PUBLISHABLE_KEY`       | Stripe publishable key (`pk_test_...` locally).          |
| `VITE_FIREBASE_API_KEY`             | Firebase Web SDK config (Firebase Console > Project Settings > Your apps > Web app). |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain.                                    |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project id.                                     |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket.                                 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender id.                            |
| `VITE_FIREBASE_APP_ID`              | Firebase web app id.                                     |

The app loads without Firebase config; Firebase is only required when the user clicks **Continue with Google**.

## Running

```bash
npm run dev       # Dev server at http://localhost:3000 (opens the browser)
npm run build     # Production build to dist/
npm run preview   # Preview the production build
npm run lint      # ESLint
```

The dev port is set in `vite.config.js`. The backend must be running, and for payments to complete locally the Stripe CLI must forward webhooks to it (see the backend README).

## Pages and routing

| Route                           | Component                 | Description                                              |
|---------------------------------|---------------------------|----------------------------------------------------------|
| `/`, `/login`                   | `LoginPage`               | Login (Google)                                           |
| `/signup`                       | `SignUpPage`              | Sign-up with Google                                      |
| `/dashboard`                    | `App.jsx`                 | Search form and recent trips                             |
| `/flights`                      | `FlightListingPage`       | Results, sort, filters, details panel                    |
| `/passengers`                   | `PassengerDetailsPage`    | Traveller and contact details                            |
| `/seat-choice`                  | `SeatSelectionChoicePage` | Choose seats or skip to checkout                         |
| `/seats`                        | `SeatSelectionPage`       | Seat map per flight segment                              |
| `/payment/:bookingId`           | `PaymentPage`             | Stripe Payment Element and order summary                 |
| `/payment/:bookingId/processing`| `BookingResultPage`       | Stripe return URL; live booking status                   |
| `/booking/:bookingId`           | `BookingResultPage`       | Booking status from the trips list                       |
| `/profile`                      | `ProfilePage`             | Personal, contact, passport, and travel preferences      |

All routes except `/`, `/login`, and `/signup` are wrapped in `ProtectedRoute`.

## Authentication flow

1. User clicks **Continue with Google** on `/`.
2. `authService.signInWithGoogle()` opens a Firebase Google popup; credentials never touch Flizen servers.
3. The frontend sends the Firebase ID token to `POST /auth/verify`, which returns `{ uid, email, name, picture }`.
4. On success the user is redirected to `/dashboard`. API calls send the ID token as `Authorization: Bearer <token>`.

Raw Firebase error codes are mapped to user-friendly messages in `authService.js`. Email / password fields are present but disabled ("Coming soon"); when implemented they must use `signInWithEmailAndPassword`, never send credentials to the backend.

## Booking flow

1. **Search:** `BookingPanel` validates the form, saves it to `sessionStorage` (`flizen_last_search`), and navigates to `/flights?from=...&to=...&departureDate=...&adults=...&cabinClass=...&tripType=...` (plus `returnDate` for round trips).
2. **Results:** `FlightListingPage` uses the in-memory cache (`flightCache.js`) or calls `GET /api/flights/search`. Sort pills and `FlightFilterPanel` work client-side without re-fetching. Round trips are picked in two steps (outbound, then return) from the same Duffel offer.
3. **Passengers:** name, date of birth, gender, nationality, passport details when required, and contact email + phone. The primary traveller is pre-filled from the saved profile.
4. **Seats:** pick seats on `/seats` or skip to checkout.
5. **Checkout:** `POST /api/bookings/draft` creates the booking (server-side price), then `/payment/:bookingId` mounts Stripe Elements against `POST /api/payments/intents`.
6. **Result:** Stripe redirects to `/payment/:bookingId/processing`, which polls `GET /api/bookings/:id` every 2.5 s until the status settles.

### Booking result page

- Trip summary with airports shown as `City (CODE)`.
- While processing: a three-step tracker (payment received, confirming with airline, ticket issued).
- Summary card with **Airline Reference** (shown only once the booking is `confirmed`), **Booking ID**, and **Amount**. The Booking ID is shortened to its first 8 characters; its copy button copies the full ID.
- Confirmed bookings show **View My Trips**. Failed payments show **Try again**.

### Round-trip pricing

Duffel prices a round trip as one bundled offer, so the UI shows a single total with a "Bundled round-trip fare" note rather than adding up departure and return prices.

### Seat selection limitation

The seat map is a local visual mock. Picks are saved with the booking as preferences (`confirmed_with_duffel: false`) and are never sent to Duffel; airlines assign real seats at check-in.

## Form inputs

### Phone number (`PhoneInput`)

- Searchable country-code picker showing flag, country name, and dial code. Search by name, code (`+44`), or ISO code (`FR`).
- The number formats as you type in the selected country's style, e.g. `(548) 333-3136` for +1 or `20 7946 0018` for +44. The placeholder shows a sample number for that country.
- Pasting a full international number (e.g. `+33 6 12 34 56 78`) switches the country automatically.
- The default country comes from the browser locale, falling back to US.
- Values are stored as E.164 (`+15483333136`). `phoneError()` checks that the number is real for its country, so numbers the airline would reject are caught before payment.
- Flags are SVGs from `country-flag-icons` (Windows does not render flag emoji). `vite.config.js` keeps them as separate files so only flags on screen are downloaded.

### Nationality (`SearchableDropdown`)

Nationality on the passenger details and profile pages uses a searchable dropdown: best matches first, Enter selects the top result, Escape closes.

## State persistence

- **Search form:** pre-filled from `sessionStorage` when returning to the dashboard. The flight cache is cleared via **Back to Home**.
- **Booking flow (Back / Forward):** `bookingFlowMemory.js` remembers flight-list sort, filters and selected flight, passenger and contact details, and selected seats.
  - Stored in `sessionStorage` only (this tab), expires after 30 minutes, and is keyed by search / offer so a new search starts fresh.
  - Cleared on sign-out.
  - Never used on payment pages and never stores payment data.

## Currency handling

`detectUserCurrency()` reads `navigator.language`, maps the region (e.g. `CA` from `en-CA`) to an ISO 4217 code, and sends it as `currency` to the backend, which passes it to Duffel. Falls back to `USD`.

## Design notes

- Theme: dark `bg-[#121212]` / `bg-[#1F1F1F]` surfaces, `border-[#2C2C2C]` dividers, pill-shaped (`rounded-full`) inputs and buttons.
- Typography: Plus Jakarta Sans with Material Design 3 type tokens via Tailwind (`font-headline-md`, `font-label-sm`, etc.).
- Icons: Google Material Symbols (`material-symbols-outlined`).
- The Stripe Payment Element is themed to match (fonts, pill inputs, tabs, dropdowns) in `PaymentPage.jsx`.
- Custom thin scrollbar in `index.css` and `AirportAutocomplete.css`.

## Testing payments locally

- Use the Stripe **test** publishable key. Test card `4242 4242 4242 4242`, any future expiry, any CVC.
- `4000 0027 6000 3184` triggers 3D Secure and exercises the return-URL path.
- The backend handles all Duffel calls; no frontend Duffel key is needed.

No frontend unit-test suite is configured yet.

## Production deployment checklist

1. Set `VITE_API_BASE_URL` to the HTTPS backend URL and `VITE_STRIPE_PUBLISHABLE_KEY` to the live `pk_live_...` key.
2. Use the production Firebase web config.
3. Serve `dist/` over HTTPS (the build is fully static).
4. Add the production origin to the backend's `CORS_ORIGINS` and to Firebase Auth authorised domains.
5. Rebuild after switching keys; publishable keys are baked into `dist/` at build time.
