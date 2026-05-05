# Flizen Frontend

React frontend for the Flizen flight booking platform. Dark-mode UI styled with Tailwind CSS and Material Design 3 tokens.

## Structure

```
src/
  main.jsx                          # App entry point, router setup
  App.jsx                           # Dashboard page layout
  index.css                         # Global styles, custom scrollbar classes
  components/
    Navbar.jsx                      # Top navigation bar
    BookingPanel.jsx                # Flight search form (airports, dates, passengers, cabin class)
    AirportAutocomplete.jsx         # Airport search with backend-backed suggestions
    DatePickerField.jsx             # Calendar date picker with past-date validation
    DatePickerDOB.jsx               # Date of birth picker (past dates only, for passenger form)
    PassengerSelector.jsx           # Adults / children / infants selector
    CabinClassSelector.jsx          # Economy / Premium Economy / Business / First dropdown
    FlightListCard.jsx              # Single flight offer card on the listing page
    FlightDetailsPanel.jsx          # Sticky side panel: segments, baggage, fare conditions, price
    FlightFilters.jsx               # Sort pills + Filter button on the listing page
    FlightFilterPanel.jsx           # Slide-in filter panel: stops, price, airlines, time, duration
    RouteInfoHeader.jsx             # Route + date summary header on listing page
    FlightHistory.jsx               # Recent trips card (dashboard — Firestore integration pending)
    ProtectedRoute.jsx              # Auth guard — redirects unauthenticated users to /login
    auth/
      AuthInput.jsx                 # Shared dark-theme input field
      AuthButton.jsx                # Shared white primary button
      GoogleIcon.jsx                # Google brand SVG icon
  pages/
    LoginPage.jsx                   # / and /login routes — Google + email/password login
    SignUpPage.jsx                  # /signup route — Google sign-up
    FlightListingPage.jsx           # /flights route — list, filter, sort, and details panel
    PassengerDetailsPage.jsx        # /passengers route — traveller info form
  services/
    apiService.js                   # Airport search API calls
    flightService.js                # Flight search API calls + data transformation
    flightCache.js                  # In-memory Map cache for fetched flight results
    firebase.js                     # Firebase app init (lazy, reads VITE_FIREBASE_* env vars)
    authService.js                  # signInWithGoogle(), signOut() — wraps Firebase Auth
  utils/
    flightUtils.js                  # Pure helpers: formatDuration, formatPrice, getStopsLabel, sortFlights, detectUserCurrency
    searchParamUtils.js             # URL search param parsing
  styles/
    AirportAutocomplete.css         # Scrollbar + dropdown styles for airport input
  data/
    suggestedRoutes.js              # Static list of suggested routes (dashboard placeholder)
```

## Setup

```bash
npm install
```

Create a `.env.local` file (never commit this):

```
VITE_API_BASE_URL=http://localhost:8000

# Firebase — get these from Firebase Console > Project Settings > Your apps > Web app
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

The app loads without Firebase config — Firebase is only required when the user clicks **Continue with Google**.

## Running

```bash
npm run dev     # Development server at http://localhost:5173
npm run build   # Production build
npm run preview # Preview production build locally
```

## Pages and routing

| Route          | Component              | Description                                                        |
|----------------|------------------------|--------------------------------------------------------------------|
| `/`            | `LoginPage`            | Login — entry point for all users                                  |
| `/login`       | `LoginPage`            | Same as `/`                                                        |
| `/signup`      | `SignUpPage`           | Sign-up with Google                                                |
| `/dashboard`   | `App.jsx`              | Dashboard with booking form and flight history                     |
| `/flights`     | `FlightListingPage`    | Flight results, sort, filter panel, and details side panel         |
| `/passengers`  | `PassengerDetailsPage` | Passenger details form before booking confirmation                 |

## Authentication flow

1. User lands on `/` (`LoginPage`) and clicks **Continue with Google**.
2. `authService.signInWithGoogle()` opens a Firebase Google popup — credentials never touch Flizen servers.
3. Firebase returns a short-lived ID token. The frontend POSTs it to `POST /auth/verify` on the backend.
4. The backend verifies the token using Firebase Admin SDK (cryptographic check, no DB call) and returns `{ uid, email, name, picture }`.
5. On success the user is redirected to `/dashboard`.

Firebase config is read from `VITE_FIREBASE_*` env vars at runtime. Raw Firebase error codes are never surfaced to the user — they are mapped to safe, user-friendly messages in `authService.js`.

Email / password sign-in fields are present in the UI but intentionally disabled (marked "Coming soon"). When implemented they must use `firebase/auth` `signInWithEmailAndPassword` — credentials must never be sent directly to the backend.

## Flight search flow

1. User fills in the booking form on the dashboard (`BookingPanel`) — airports, date, passengers, cabin class.
2. On submit, the form validates input, saves state to `sessionStorage` (`flizen_last_search`), and navigates to `/flights?from=...&to=...&departureDate=...&adults=...&cabinClass=...`.
3. `FlightListingPage` reads URL params, checks the in-memory flight cache (`flightCache.js`), and if stale calls `GET /api/flights/search` on the backend.
4. Results are rendered as `FlightListCard` items. The **Filter** button opens `FlightFilterPanel` — a slide-in panel that filters by stops, price, airlines, departure time slot, and duration. Sort pills (Best / Cheapest / Fastest) reorder the displayed list without re-fetching.
5. Selecting a card opens `FlightDetailsPanel` — a sticky side panel showing segments, layovers, baggage allowance, CO2 estimate, passport-at-booking requirement, fare conditions, and total price.
6. Clicking **Continue Booking** navigates to `/passengers` with the selected flight and search criteria passed via router state.
7. `PassengerDetailsPage` collects traveller details (name, DOB, gender, nationality, and optionally passport details when `passportRequired` is true) plus contact info. All fields are validated on blur with ICAO and regex rules and again on submit.

## Search state persistence

When navigating back to the dashboard from `/flights`, the booking form is pre-populated from `sessionStorage`. This lets users adjust a single field without re-entering everything. The cache is cleared via the **Back to Home** link.

## Currency handling

`detectUserCurrency()` in `flightUtils.js` reads `navigator.language`, extracts the region tag (e.g. `CA` from `en-CA`), and maps it to an ISO 4217 currency code. The result is sent as a `currency` query parameter to the backend which passes it to Duffel. Falls back to `USD` if the locale is unrecognised.

## Filter panel

`FlightFilterPanel` is a client-side filter — no additional API calls are made. It operates on the already-fetched `allFlights` array. Filters are applied via `useMemo` in `FlightListingPage` and are reset when a new search is performed.

## Design notes

- Theme: dark `bg-[#121212]` / `bg-[#1F1F1F]` cards, `border-[#2C2C2C]` dividers.
- Typography: Material Design 3 type tokens via Tailwind (`font-headline-md`, `font-label-sm`, etc.).
- Icons: Google Material Symbols (`material-symbols-outlined` class).
- Custom scrollbar style (thin, `#2C2C2C` thumb) defined in `index.css` and `AirportAutocomplete.css`.


## Setup

```bash
npm install
```

Create a `.env.local` file (never commit this):

```
VITE_API_BASE_URL=http://localhost:8000

# Firebase — get these from Firebase Console → Project Settings → Your apps → Web app
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

The app loads without Firebase config — the config is only required when the user clicks "Continue with Google".

## Running

```bash
npm run dev    # Development server at http://localhost:5173
npm run build  # Production build
npm run preview # Preview production build locally
```

## Pages and routing

| Route        | Component           | Description                                                |
|--------------|---------------------|---------------------------------------------------------|
| `/`          | `LoginPage`         | Login — entry point for all users                         |
| `/login`     | `LoginPage`         | Same as `/`                                               |
| `/signup`    | `SignUpPage`        | Sign-up with Google                                       |
| `/dashboard` | `App.jsx`           | Dashboard with booking form and widgets                   |
| `/flights`   | `FlightListingPage` | Flight results, sorting, and details panel                |

## Authentication flow

1. User lands on `/` (LoginPage) and clicks **Continue with Google**.
2. `authService.signInWithGoogle()` opens a Firebase Google popup — credentials never touch Flizen servers.
3. Firebase returns a short-lived ID token. The frontend POSTs it to `POST /auth/verify` on the backend.
4. The backend verifies the token using Firebase Admin SDK (cryptographic check, no DB call) and returns `{ uid, email, name, picture }`.
5. On success the user is redirected to `/dashboard`.

Firebase config is read from `VITE_FIREBASE_*` env vars at runtime. Raw Firebase error codes are never surfaced to the user — they are mapped to safe, user-friendly messages in `authService.js`.

Email / password sign-in fields are present in the UI but intentionally disabled (marked "Coming soon"). When implemented they must use `firebase/auth` `signInWithEmailAndPassword` — credentials must never be sent directly to the backend.

## Flight search flow

1. User fills in the booking form on the dashboard (`BookingPanel`).
2. On submit, the form validates input, saves the form state to `sessionStorage` (`flizen_last_search`), and navigates to `/flights?origin=...&destination=...&...`.
3. `FlightListingPage` reads the URL params, calls `GET /api/flights/search` on the backend, and renders results via `FlightListCard`.
4. Selecting a card opens `FlightDetailsPanel` — a sticky side panel showing segments, layovers, baggage, fare conditions, and price.
5. The **Continue** button in the panel initiates the booking handoff (not yet wired to a booking flow).

## Search state persistence

When a user navigates back to the dashboard from `/flights`, the booking form is pre-populated from `sessionStorage`. This allows the user to adjust a single field without re-entering everything. The saved state is cleared when the browser session closes.


## Currency handling

`detectUserCurrency()` in `flightUtils.js` reads `navigator.language`, extracts the region tag (e.g. `CA` from `en-CA`), and maps it to an ISO 4217 currency code. The result is sent as a `currency` query parameter to the backend, which passes it to Duffel. Duffel then returns offer prices in that currency. Supported currencies are those accepted by the Duffel API. Falls back to `USD` if the locale is unrecognised or unsupported.

## Design notes

- Theme: dark `bg-[#121212]` / `bg-[#1F1F1F]` cards, `border-[#2C2C2C]` dividers.
- Typography: Material Design 3 type tokens via Tailwind (`font-headline-md`, `font-label-sm`, etc.).
- Icons: Google Material Symbols (`material-symbols-outlined` class).
- Custom scrollbar style (thin, white-30% thumb) defined in `index.css` and `AirportAutocomplete.css`, applied to dropdown lists and `FlightDetailsPanel`.
