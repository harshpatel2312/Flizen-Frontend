export default function BookingPanel() {
  return (
    <section className="bg-[#121212] rounded-xl p-6 border border-[#2C2C2C] flex flex-col gap-container-margin">
      <h2 className="font-headline-md text-headline-md text-primary">Book a Flight</h2>
      
      <div className="flex flex-col gap-element-gap relative">
        {/* From */}
        <div className="flex items-center bg-[#1F1F1F] rounded-lg p-3 group focus-within:ring-1 focus-within:ring-secondary-container transition-all">
          <span className="material-symbols-outlined text-outline mr-3">flight_takeoff</span>
          <div className="flex-1">
            <label className="font-label-sm text-label-sm text-outline-variant block mb-1">From</label>
            <input
              className="bg-transparent border-none text-primary font-body-md p-0 w-full focus:ring-0 placeholder:text-outline-variant"
              placeholder="Where from?"
              type="text"
              defaultValue="New York (JFK)"
            />
          </div>
        </div>

        {/* Decorative Line / Swap */}
        <div className="absolute left-[24px] top-[calc(50%-16px)] h-[32px] w-[1px] bg-[#2C2C2C] z-0"></div>
        <button className="absolute right-4 top-[calc(50%-16px)] bg-[#121212] border border-[#2C2C2C] rounded-full p-1 z-10 hover:bg-[#1F1F1F] transition-colors">
          <span className="material-symbols-outlined text-primary text-[16px]">swap_vert</span>
        </button>

        {/* To */}
        <div className="flex items-center bg-[#1F1F1F] rounded-lg p-3 group focus-within:ring-1 focus-within:ring-secondary-container transition-all z-0">
          <span className="material-symbols-outlined text-outline mr-3">flight_land</span>
          <div className="flex-1">
            <label className="font-label-sm text-label-sm text-outline-variant block mb-1">To</label>
            <input
              className="bg-transparent border-none text-primary font-body-md p-0 w-full focus:ring-0 placeholder:text-outline-variant"
              placeholder="Where to?"
              type="text"
              defaultValue="London (LHR)"
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-element-gap">
        <div className="flex items-center bg-[#1F1F1F] rounded-lg p-3 group focus-within:ring-1 focus-within:ring-secondary-container transition-all">
          <span className="material-symbols-outlined text-outline mr-3">calendar_today</span>
          <div className="flex-1">
            <label className="font-label-sm text-label-sm text-outline-variant block mb-1">Departure</label>
            <input
              className="bg-transparent border-none text-primary font-body-md p-0 w-full focus:ring-0 placeholder:text-outline-variant text-sm"
              placeholder="Add date"
              type="text"
              defaultValue="Oct 12"
            />
          </div>
        </div>
        <div className="flex items-center bg-[#1F1F1F] rounded-lg p-3 group focus-within:ring-1 focus-within:ring-secondary-container transition-all">
          <span className="material-symbols-outlined text-outline mr-3">event_repeat</span>
          <div className="flex-1">
            <label className="font-label-sm text-label-sm text-outline-variant block mb-1">Return</label>
            <input
              className="bg-transparent border-none text-primary font-body-md p-0 w-full focus:ring-0 placeholder:text-outline-variant text-sm"
              placeholder="Add date"
              type="text"
              defaultValue="Oct 20"
            />
          </div>
        </div>
      </div>

      {/* Passengers & Class */}
      <div className="grid grid-cols-2 gap-element-gap border-b border-[#2C2C2C] pb-container-margin">
        <div className="flex items-center bg-[#1F1F1F] rounded-lg p-3 cursor-pointer hover:bg-surface-bright transition-colors">
          <span className="material-symbols-outlined text-outline mr-3">person</span>
          <div className="flex-1">
            <span className="font-label-sm text-label-sm text-outline-variant block mb-1">Passengers</span>
            <span className="text-primary font-body-md text-sm">1 Adult</span>
          </div>
        </div>
        <div className="flex items-center bg-[#1F1F1F] rounded-lg p-3 cursor-pointer hover:bg-surface-bright transition-colors">
          <span className="material-symbols-outlined text-outline mr-3">airline_seat_recline_extra</span>
          <div className="flex-1">
            <span className="font-label-sm text-label-sm text-outline-variant block mb-1">Class</span>
            <span className="text-primary font-body-md text-sm">Business</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-element-gap">
        <button className="bg-primary text-on-primary font-label-md text-label-md font-bold py-4 rounded-lg w-full hover:opacity-90 transition-opacity">
          Search Flights
        </button>
        <button className="bg-transparent border border-[#2C2C2C] text-primary font-label-md text-label-md py-4 rounded-lg w-full hover:bg-[#1F1F1F] transition-colors">
          Track Flight
        </button>
      </div>
    </section>
  );
}
