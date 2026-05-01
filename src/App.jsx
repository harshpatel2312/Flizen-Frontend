import Navbar from './components/Navbar';
import BookingPanel from './components/BookingPanel';
import QuickActions from './components/QuickActions';
import FlightStatusCheck from './components/FlightStatusCheck';
import SuggestedRoutes from './components/SuggestedRoutes';
import FlightHistory from './components/FlightHistory';
import './index.css';

export default function App() {
  return (
    <div className="dark">
      <Navbar />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-container-margin py-container-margin grid grid-cols-1 lg:grid-cols-12 gap-container-margin">
        {/* Left Column: Booking & Actions */}
        <div className="lg:col-span-4 flex flex-col gap-container-margin">
          <BookingPanel />
          <QuickActions />
          <FlightStatusCheck />
        </div>

        {/* Right Column: History & Visuals */}
        <div className="lg:col-span-8 flex flex-col gap-section-gap">
          <FlightHistory />
          <SuggestedRoutes />
        </div>
      </main>
    </div>
  );
}
