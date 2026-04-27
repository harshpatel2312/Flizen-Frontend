export default function FlightStatusCheck() {
  return (
    <section className="bg-[#121212] rounded-xl p-6 border border-[#2C2C2C] flex flex-col gap-element-gap">
      <h3 className="font-label-md text-label-md text-primary font-semibold mb-2">Quick Status Check</h3>
      <div className="flex gap-element-gap">
        <div className="flex-1 bg-[#1F1F1F] rounded-lg p-3 group focus-within:ring-1 focus-within:ring-secondary-container transition-all flex items-center">
          <span className="material-symbols-outlined text-outline mr-2 text-sm">tag</span>
          <input
            className="bg-transparent border-none text-primary font-body-md p-0 w-full focus:ring-0 placeholder:text-outline-variant text-sm"
            placeholder="Flight Number"
            type="text"
          />
        </div>
        <button className="bg-[#1F1F1F] border border-[#2C2C2C] text-primary rounded-lg px-4 hover:bg-surface-bright transition-colors flex items-center justify-center">
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>
    </section>
  );
}
