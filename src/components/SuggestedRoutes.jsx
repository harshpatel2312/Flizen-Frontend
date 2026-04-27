import FlightCard from './FlightCard';
import { suggestedRoutes } from '../data/suggestedRoutes';

export default function SuggestedRoutes() {
  return (
    <section className="flex flex-col gap-container-margin">
      <div className="flex justify-between items-end">
        <h2 className="font-headline-md text-headline-md text-primary">Suggested Routes</h2>
        <a className="font-label-sm text-label-sm text-outline hover:text-primary transition-colors" href="#">
          View All
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-element-gap">
        {suggestedRoutes.map((flight) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
      </div>
    </section>
  );
}
