# Flizen Frontend

React frontend for the Flizen flight booking platform. Dark-mode UI styled with Tailwind CSS and Material Design 3 tokens.

## Structure

```
src/
  main.jsx                  # App entry point, router setup
  App.jsx                   # Dashboard page layout
  index.css                 # Global styles, custom scrollbar classes
  components/
    Navbar.jsx              # Top navigation bar
    BookingPanel.jsx        # Flight search form (airports, dates, passengers, cabin class)
    AirportAutocomplete.jsx # Airport search with backend-backed suggestions
    DatePickerField.jsx     # Calendar date picker with past-date validation
    PassengerSelector.jsx   # Adults / children / infants selector
    CabinClassSelector.jsx  # Economy / Premium Economy / Business / First
    FlightListCard.jsx      # Single flight offer card on the listing page
    FlightDetailsPanel.jsx  # Sticky side panel with full offer breakdown
    FlightFilters.jsx       # Sort controls on the listing page
    RouteInfoHeader.jsx     # Route + date summary header on listing page
    FlightHistory.jsx       # Recent searches widget (dashboard)
    SuggestedRoutes.jsx     # Popular route suggestions (dashboard)
    QuickActions.jsx        # Shortcut tiles (dashboard)
    FlightStatusCheck.jsx   # Status lookup widget (dashboard)
    BookingPanel.jsx        # (see above)
  pages/
    FlightListingPage.jsx   # /flights route — list + detail panel
  services/
    apiService.js           # Airport search API calls
    flightService.js        # Flight search API calls + data transformation
  utils/
    flightUtils.js          # Pure helpers: formatDuration, formatPrice, getStopsLabel, sortFlights, detectUserCurrency, etc.
    searchParamUtils.js     # URL search param parsing and building
  styles/
    AirportAutocomplete.css # Scrollbar + dropdown styles for airport input
  data/
    suggestedRoutes.js      # Static list of suggested routes
```

## Setup

```bash
npm install
```

Create a `.env` file:

```
VITE_API_BASE_URL=http://localhost:8000
```

## Running

```bash
npm run dev    # Development server at http://localhost:3000
npm run build  # Production build
npm run preview # Preview production build locally
```

## Pages and routing

| Route      | Component           | Description                                         |
|------------|---------------------|-----------------------------------------------------|
| `/`        | `App.jsx`           | Dashboard with booking form and informational widgets |
| `/flights` | `FlightListingPage` | Flight results, sorting, and details panel          |

## Flight search flow

1. User fills in the booking form on the dashboard (`BookingPanel`).
2. On submit, the form validates input, saves the form state to `sessionStorage` (`flizen_last_search`), and navigates to `/flights?origin=...&destination=...&...`.
3. `FlightListingPage` reads the URL params, calls `GET /api/flights/search` on the backend, and renders results via `FlightListCard`.
4. Selecting a card opens `FlightDetailsPanel` — a sticky side panel showing segments, layovers, baggage, fare conditions, and price.
5. The **Continue** button in the panel initiates the booking handoff (not yet wired to a booking flow).

## Search state persistence

When a user navigates back to the dashboard from `/flights` (via "Back to Home"), the booking form is pre-populated from `sessionStorage`. This allows the user to adjust a single field (e.g. the departure date) without re-entering everything. The saved state is cleared when the browser tab or session closes.

## Currency handling

`detectUserCurrency()` in `flightUtils.js` reads `navigator.language`, extracts the region tag (e.g. `CA` from `en-CA`), and maps it to an ISO 4217 currency code. The result is sent as a `currency` query parameter to the backend, which passes it to Duffel. Duffel then returns offer prices in that currency. Supported currencies are those accepted by the Duffel API. Falls back to `USD` if the locale is unrecognised or unsupported.

## Design notes

- Theme: dark `bg-[#121212]` / `bg-[#1F1F1F]` cards, `border-[#2C2C2C]` dividers.
- Typography: Material Design 3 type tokens via Tailwind (`font-headline-md`, `font-label-sm`, etc.).
- Icons: Google Material Symbols (`material-symbols-outlined` class).
- Custom scrollbar style (thin, white-30% thumb) defined in `index.css` and `AirportAutocomplete.css`, applied to dropdown lists and `FlightDetailsPanel`.
