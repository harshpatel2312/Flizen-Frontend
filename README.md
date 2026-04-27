# Flizen Premium Flight Booking Dashboard

A modern, dark-mode flight booking and management dashboard built with React and Tailwind CSS, inspired by Uber's design philosophy.

## 🚀 Project Overview

Flizen is a premium flight booking platform featuring:
- **Clean, modular React components** for maintainability and reusability
- **Dark theme UI** with Material Design 3 colors following Uber's design language
- **Responsive design** that works on desktop and tablet
- **Tailwind CSS** for styling with custom theme configuration
- **Interactive booking form** with searchable airport autocomplete
- **Calendar date picker** with past date validation
- **Passenger selector** with adults, children, and infants
- **Cabin class selector** with 4 cabin options
- **Dynamic route visualization** with curved SVG paths and airport markers
- **Flight search** with backend integration
- **Quick action tiles** for common tasks

## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar.jsx                    # Navigation bar with logo
│   ├── BookingPanel.jsx              # Main flight booking form
│   ├── AirportAutocomplete.jsx       # Searchable airport selector
│   ├── DatePickerField.jsx           # Custom calendar date picker
│   ├── PassengerSelector.jsx         # Passenger count selector
│   ├── CabinClassSelector.jsx        # Cabin class options
│   ├── QuickActions.jsx              # Quick action tiles
│   ├── FlightStatusCheck.jsx         # Flight number lookup
│   ├── RouteMap.jsx                  # Dynamic route visualization
│   ├── SuggestedRoutes.jsx           # Suggested flight routes
│   └── FlightCard.jsx                # Individual flight card
├── services/
│   └── apiService.js                 # Backend API integration
├── data/
│   └── suggestedRoutes.js            # Sample flight data
├── App.jsx                           # Main app component
├── main.jsx                          # React entry point
├── index.css                         # Global styles and Tailwind directives
├── tailwind.config.js                # Tailwind configuration
├── postcss.config.js                 # PostCSS configuration
├── vite.config.js                    # Vite build configuration
└── .env.example                      # Environment variables template
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- FastAPI backend running (see [Backend Setup](#backend-setup))

### Installation Steps

1. **Navigate to the project directory:**
   ```bash
   cd Flizen-Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and set:
   - `VITE_API_BASE_URL`: Backend API URL (default: `http://localhost:8000`)

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:5173`

## 🎨 Key Components

### AirportAutocomplete
Searchable airport selector with real-time suggestions.
- Searches by city, airport name, IATA code, ICAO code, or country
- Shows airport name, city, country, and IATA code
- Prevents selecting the same airport for departure and arrival
- Styled to match dark dashboard theme

### DatePickerField
Custom calendar date picker integrated into the booking form.
- Disables past dates
- Return date validation (must be after departure)
- Quick actions for "Today" and "Tomorrow"
- Displays friendly date formats
- Matches dark UI theme

### PassengerSelector
Manages passenger breakdown.
- Adults (minimum 1)
- Children (2-11 years)
- Infants (under 2 years, max 1 per adult)
- Plus/minus controls for easy adjustment

### CabinClassSelector
Selects cabin class for the flight.
- Economy
- Premium Economy
- Business
- First
- Icons and descriptions for each class

### RouteMap
Dynamic map visualization showing flight routes.
- Displays curved route line between airports
- Shows airport markers with IATA codes and city names
- Updates automatically when airports are selected
- Uses simplified map projection for coordinates
- Matches dark theme with gradient effects

## 📡 Backend Integration

The frontend communicates with the FastAPI backend for:
- Airport search and autocomplete
- Flight search based on criteria
- Dynamic route data

### API Endpoints Used

**Airport Search:**
```
GET /airports/search?q=<query>
```

**Flight Search:**
```
POST /flights/search
```

**Health Check:**
```
GET /health
```

See [Backend README](../Flizen-Backend/README.md) for full API documentation.

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## 🔄 Backend Setup

To run the full application, you also need to set up the backend:

1. **Navigate to backend directory:**
   ```bash
   cd ../Flizen-Backend
   ```

2. **Follow backend setup instructions** from [Backend README](../Flizen-Backend/README.md)

3. **Start the backend:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## 📋 Features

### Booking Form
- ✅ Airport autocomplete with real-time search
- ✅ Calendar date picker with validation
- ✅ Passenger selector (adults, children, infants)
- ✅ Cabin class selector
- ✅ Form validation with error messages
- ✅ Search button with loading state

### Route Map
- ✅ Dynamic route visualization
- ✅ Curved SVG paths between airports
- ✅ Airport markers with labels
- ✅ Real-time updates based on selection
- ✅ Responsive design

### UI/UX
- ✅ Dark theme throughout
- ✅ Material Design 3 colors
- ✅ Plus Jakarta Sans typography
- ✅ Smooth transitions and hover states
- ✅ Material Symbols icons
- ✅ Consistent spacing and layout

## 🛠️ Development

### Component Architecture
Components are modular and reusable:
- Each component handles its own state
- Parent components pass data via props
- Services handle API communication
- Tailwind CSS for all styling

### Adding New Components

1. Create component file in `src/components/`
2. Use existing Tailwind color and spacing tokens
3. Import Material Symbols for icons
4. Follow existing component patterns

### Environment Variables

- `VITE_API_BASE_URL`: Backend API URL (required for production)

## 📚 Design System

### Colors
- Background: `#141313`
- Surface: `#1F1F1F`
- Primary: `#FFFFFF`
- Secondary: `#0460e3`, `#b1c5ff`
- Borders: `#2C2C2C`
- Text: `#e5e2e1`

### Typography
- Headline: 24px (Plus Jakarta Sans, 600)
- Body: 16px (Plus Jakarta Sans, 400)
- Label: 12px-14px (Plus Jakarta Sans, 500-600)

### Spacing
- Container margin: 24px
- Section gap: 40px
- Element gap: 12px
- Gutter: 16px

## 📄 License

MIT

---

For backend setup and API documentation, see [Flizen Backend README](../Flizen-Backend/README.md)

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## 🎨 Design System

### Colors
The project uses a comprehensive Material Design 3 color system configured in `tailwind.config.js`:
- **Primary**: #FFFFFF (white)
- **Secondary**: #B1C5FF (light blue)
- **Background**: #141313 (near black)
- **Surface**: #121212 (dark gray)
- **Error**: #FFB4AB (light red)

### Typography
- **Font**: Plus Jakarta Sans (Google Fonts)
- **Text Sizes**: display-lg, headline-lg, headline-md, body-lg, body-md, label-md, label-sm
- **All defined** in tailwind.config.js for consistency

### Spacing
Custom spacing utilities configured:
- `gap-section-gap`: 40px
- `gap-gutter`: 16px
- `gap-container-margin`: 24px
- `gap-element-gap`: 12px

### Icons
Material Symbols Outlined icons (loaded via Google Fonts CDN in index.html)

## 🧩 Component Overview

### Navbar
- Displays Flizen logo
- Navigation links (My Trips, Flight Status, Help)
- Notifications button
- User profile avatar
- Sticky positioning for constant visibility

### BookingPanel
- "From" and "To" flight inputs with icons
- Swap button to reverse destinations
- Departure and return date inputs
- Passenger and class selectors
- Search Flights and Track Flight buttons

### QuickActions
- Three action tiles with icons
- Track a Flight
- View My Trips
- Flight Status

### FlightStatusCheck
- Quick status check section
- Flight number input
- Search button with icon

### RouteMap
- Beautiful visualization of flight routes
- Animated SVG path with gradient
- Start and end location labels
- Zoom in/out controls
- Responsive height

### SuggestedRoutes
- Section title with "View All" link
- Grid of FlightCard components
- Data-driven from `suggestedRoutes.js`

### FlightCard
- Airline logo and name
- Class of service
- Price display
- Origin and destination codes
- Departure and arrival times
- Flight duration
- Hover effects

## 📝 Adding New Flight Data

Edit `src/data/suggestedRoutes.js`:

```javascript
export const suggestedRoutes = [
  {
    id: 1,
    airline: "Airline Name",
    airlineCode: "AB",
    class: "Business Class",
    price: 1250,
    origin: "NYC",
    destination: "LON",
    departureTime: "08:00 AM",
    arrivalTime: "09:35 AM",
    duration: "1h 35m"
  },
  // Add more flights...
];
```

## 🔧 Customization

### Changing Colors
Edit the `colors` object in `tailwind.config.js` to customize the theme.

### Adjusting Spacing
Modify the `spacing` object in `tailwind.config.js` for different gaps and margins.

### Font Changes
Update the `fontFamily` and `fontSize` objects in `tailwind.config.js`.

### Adding Global Styles
Add CSS to `src/index.css` for global styling needs.

## 🚀 Key Features

- ✅ **Modular Components**: Each component has a single responsibility
- ✅ **Reusable**: Components use props for flexibility
- ✅ **Responsive**: Works on mobile, tablet, and desktop
- ✅ **Dark Theme**: Premium dark mode throughout
- ✅ **Performance**: Built with Vite for fast development and builds
- ✅ **Maintainable**: Clean, readable JSX code
- ✅ **Extensible**: Easy to add new components and features
- ✅ **Material Icons**: Full Material Symbols support

## 📦 Dependencies

- **React 18.2.0**: UI framework
- **Vite 5.0.7**: Build tool and dev server
- **Tailwind CSS 3.3.6**: Utility-first CSS framework
- **PostCSS 8.4.32**: CSS transformations
- **Autoprefixer 10.4.16**: Vendor prefixes for CSS

## 💡 Tips for Development

1. **Component Naming**: Use PascalCase for components (e.g., `FlightCard.jsx`)
2. **File Organization**: Keep components and logic organized in respective folders
3. **Tailwind Classes**: Use Tailwind utilities whenever possible before writing custom CSS
4. **Props Validation**: Consider adding prop-types for larger components as the project grows
5. **State Management**: As complexity grows, consider React Context or a state management library

## 🔄 Future Enhancements

- Add state management (Redux, Zustand, or Context API)
- Integrate with a backend API
- Add authentication
- Implement form validation
- Add more pages (search results, booking confirmation, etc.)
- Performance optimizations with lazy loading
- TypeScript support

## 📄 License

See LICENSE file for details.