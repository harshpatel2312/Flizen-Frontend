import { useMemo } from 'react';

/**
 * Calculate SVG coordinates for airports on a map projection
 * Using simplified mercator-like projection
 */
function calculateMapPosition(lat, lng) {
  // Normalize coordinates to SVG viewBox (0-400 x 0-200)
  // Latitude range: -90 to 90 maps to 200 to 0
  // Longitude range: -180 to 180 maps to 0 to 400
  const x = ((lng + 180) / 360) * 400;
  const y = ((90 - lat) / 180) * 200;
  return { x, y };
}

export default function RouteMap({ fromAirport = null, toAirport = null }) {
  const routeData = useMemo(() => {
    if (!fromAirport || !toAirport) {
      // Default empty route
      return {
        from: { x: 50, y: 150, label: 'JFK', city: 'New York' },
        to: { x: 350, y: 100, label: 'LHR', city: 'London' },
        hasRoute: false,
      };
    }

    const from = calculateMapPosition(fromAirport.latitude, fromAirport.longitude);
    const to = calculateMapPosition(toAirport.latitude, toAirport.longitude);

    return {
      from: {
        ...from,
        label: fromAirport.iata,
        city: fromAirport.city,
      },
      to: {
        ...to,
        label: toAirport.iata,
        city: toAirport.city,
      },
      hasRoute: true,
    };
  }, [fromAirport, toAirport]);

  // Calculate curved path for SVG
  const pathD = useMemo(() => {
    const { from, to } = routeData;
    // Use quadratic bezier curve with control point at top
    const controlY = Math.min(from.y, to.y) - Math.abs(from.x - to.x) / 4;
    const controlX = (from.x + to.x) / 2;
    return `M${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
  }, [routeData]);

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
        {routeData.hasRoute ? (
          <svg
            className="opacity-80 group-hover:opacity-100 transition-opacity duration-700"
            fill="none"
            height="70%"
            viewBox="0 0 400 200"
            width="90%"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Route Line */}
            <path
              d={pathD}
              stroke="url(#paint0_linear)"
              strokeDasharray="4 6"
              strokeLinecap="round"
              strokeWidth="2"
            />

            {/* Airport Markers */}
            {/* From Airport */}
            <circle
              cx={routeData.from.x}
              cy={routeData.from.y}
              fill="#FFFFFF"
              r="5"
            />
            <circle
              cx={routeData.from.x}
              cy={routeData.from.y}
              fill="#FFFFFF"
              fillOpacity="0.2"
              r="14"
            />

            {/* To Airport */}
            <circle
              cx={routeData.to.x}
              cy={routeData.to.y}
              fill="#0460e3"
              r="5"
            />
            <circle
              cx={routeData.to.x}
              cy={routeData.to.y}
              fill="#0460e3"
              fillOpacity="0.2"
              r="14"
            />

            {/* Gradient Definition */}
            <defs>
              <linearGradient
                gradientUnits="userSpaceOnUse"
                id="paint0_linear"
                x1={routeData.from.x}
                x2={routeData.to.x}
                y1={routeData.from.y}
                y2={routeData.to.y}
              >
                <stop stopColor="#FFFFFF" stopOpacity="0.2" />
                <stop offset="0.5" stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#0460e3" />
              </linearGradient>
            </defs>
          </svg>
        ) : (
          // Default placeholder SVG
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
            />
            <circle cx="50" cy="150" fill="#FFFFFF" r="4" />
            <circle cx="50" cy="150" fill="#FFFFFF" fillOpacity="0.2" r="12" />
            <circle cx="350" cy="100" fill="#0460e3" r="4" />
            <circle cx="350" cy="100" fill="#0460e3" fillOpacity="0.2" r="12" />
            <defs>
              <linearGradient
                gradientUnits="userSpaceOnUse"
                id="paint0_linear"
                x1="50"
                x2="350"
                y1="150"
                y2="100"
              >
                <stop stopColor="#FFFFFF" stopOpacity="0.2" />
                <stop offset="0.5" stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#0460e3" />
              </linearGradient>
            </defs>
          </svg>
        )}

        {/* Airport Labels */}
        <div className="absolute top-[65%] left-[5%] text-left">
          <span className="block font-label-sm text-label-sm text-white drop-shadow-md">
            {routeData.from.label}
          </span>
          <span className="block font-label-sm text-label-sm text-outline drop-shadow-md">
            {routeData.from.city}
          </span>
        </div>
        <div className="absolute top-[40%] right-[5%] text-right">
          <span className="block font-label-sm text-label-sm text-white drop-shadow-md">
            {routeData.to.label}
          </span>
          <span className="block font-label-sm text-label-sm text-outline drop-shadow-md">
            {routeData.to.city}
          </span>
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
