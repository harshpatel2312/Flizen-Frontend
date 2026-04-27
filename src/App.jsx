import { useState } from 'react';
import Navbar from './components/Navbar';
import BookingPanel from './components/BookingPanel';
import QuickActions from './components/QuickActions';
import FlightStatusCheck from './components/FlightStatusCheck';
import RouteMap from './components/RouteMap';
import SuggestedRoutes from './components/SuggestedRoutes';
import './index.css';

export default function App() {
  const [selectedRoute, setSelectedRoute] = useState({
    from: null,
    to: null,
  });

  return (
    <div className="dark">
      <Navbar />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-container-margin py-container-margin grid grid-cols-1 lg:grid-cols-12 gap-container-margin">
        {/* Left Column: Booking & Actions */}
        <div className="lg:col-span-4 flex flex-col gap-container-margin">
          <BookingPanel onRouteSelect={setSelectedRoute} />
          <QuickActions />
          <FlightStatusCheck />
        </div>

        {/* Right Column: Map & Visuals */}
        <div className="lg:col-span-8 flex flex-col gap-section-gap">
          <RouteMap
            fromAirport={selectedRoute.from}
            toAirport={selectedRoute.to}
          />
          <SuggestedRoutes />
        </div>
      </main>
    </div>
  );
}
