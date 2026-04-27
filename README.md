# Flizen

A modern, dark-mode flight booking and management dashboard built with React and Tailwind CSS, inspired by Uber's design philosophy.

## 🚀 Project Overview

Flizen is a premium flight booking platform featuring:
- **Clean, modular React components** for maintainability and reusability
- **Dark theme UI** with Material Design 3 colors
- **Responsive design** that works on desktop and tablet
- **Tailwind CSS** for styling with custom theme configuration
- **Interactive booking panel** with flight search functionality
- **Route visualization** with animated SVG paths
- **Flight cards** showing suggested routes with pricing and duration
- **Quick action tiles** for common tasks

## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar.jsx              # Navigation bar with logo and user menu
│   ├── BookingPanel.jsx        # Main flight booking form
│   ├── QuickActions.jsx        # Quick action tiles (Track, Trips, Status)
│   ├── FlightStatusCheck.jsx   # Flight number lookup form
│   ├── RouteMap.jsx            # Interactive route visualization with SVG
│   ├── SuggestedRoutes.jsx     # Section displaying flight suggestions
│   └── FlightCard.jsx          # Individual flight card component
├── data/
│   └── suggestedRoutes.js      # Flight data (easily expandable)
├── App.jsx                     # Main app component
├── main.jsx                    # React entry point
├── index.css                   # Global styles and Tailwind directives
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
└── vite.config.js              # Vite build configuration
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 16+ and npm/yarn installed

### Installation Steps

1. **Navigate to the project directory:**
   ```bash
   cd Flizen-Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will automatically open at `http://localhost:3000`

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
