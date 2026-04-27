export default function RouteMap() {
  return (
    <section className="bg-[#121212] rounded-xl border border-[#2C2C2C] h-[500px] overflow-hidden relative flex items-center justify-center group">
      {/* Fallback Map Background */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage: "url('https://placeholder.pics/svg/300')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      ></div>

      {/* Map Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent z-0"></div>

      {/* Route Visualization */}
      <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
        <svg
          className="opacity-80 group-hover:opacity-100 transition-opacity duration-700 animate-dash"
          fill="none"
          height="40%"
          viewBox="0 0 400 200"
          width="60%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M50 150 Q 200 20 350 100"
            stroke="url(#paint0_linear)"
            strokeDasharray="4 6"
            strokeLinecap="round"
            strokeWidth="2"
          ></path>
          <circle cx="50" cy="150" fill="#FFFFFF" r="4"></circle>
          <circle cx="50" cy="150" fill="#FFFFFF" fillOpacity="0.2" r="12"></circle>
          <circle cx="350" cy="100" fill="#0460e3" r="4"></circle>
          <circle cx="350" cy="100" fill="#0460e3" fillOpacity="0.2" r="12"></circle>
          <defs>
            <linearGradient
              gradientUnits="userSpaceOnUse"
              id="paint0_linear"
              x1="50"
              x2="350"
              y1="150"
              y2="100"
            >
              <stop stopColor="#FFFFFF" stopOpacity="0.2"></stop>
              <stop offset="0.5" stopColor="#FFFFFF"></stop>
              <stop offset="1" stopColor="#0460e3"></stop>
            </linearGradient>
          </defs>
        </svg>

        {/* Labels */}
        <div className="absolute top-[65%] left-[20%] text-left">
          <span className="block font-label-sm text-label-sm text-white drop-shadow-md">JFK</span>
          <span className="block font-label-sm text-label-sm text-outline drop-shadow-md">New York</span>
        </div>
        <div className="absolute top-[40%] left-[75%] text-left">
          <span className="block font-label-sm text-label-sm text-white drop-shadow-md">LHR</span>
          <span className="block font-label-sm text-label-sm text-outline drop-shadow-md">London</span>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <button className="bg-[#1F1F1F]/80 backdrop-blur border border-[#2C2C2C] rounded-lg p-2 text-primary hover:bg-surface-bright transition-colors">
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
        <button className="bg-[#1F1F1F]/80 backdrop-blur border border-[#2C2C2C] rounded-lg p-2 text-primary hover:bg-surface-bright transition-colors">
          <span className="material-symbols-outlined text-[20px]">remove</span>
        </button>
      </div>
    </section>
  );
}
