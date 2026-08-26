// src/components/SeatMap.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Aircraft seat map visualization.
//
// Layout:
//   Rows  1– 4  → Business Class   (2+2 config: A B _ _ E F)
//   Rows  5–10  → Premium Economy  (3+3 config: A B C _ D E F)
//   Rows 11–30  → Economy          (3+3 config: A B C _ D E F)
//
// Seat status colours are applied via inline styles to avoid Tailwind
// purge issues with dynamically-constructed class strings.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Seat data generation ─────────────────────────────────────────────────────

const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const BUSINESS_COLS = ['A', 'B', 'E', 'F']; // 2+2, no C or D
const TOTAL_ROWS = 30;

function getSeatType(row) {
  if (row <= 4) return 'business';
  if (row <= 10) return 'premium';
  return 'economy';
}

// Deterministic "occupied" pattern — no randomness, consistent across renders.
function isSeatOccupied(row, col) {
  const ci = COLS.indexOf(col);
  const hash = (row * 13 + ci * 29 + row * ci * 3 + 7) % 97;
  const threshold = getSeatType(row) === 'economy' ? 57 : 33;
  return hash < threshold;
}

function generateSeats() {
  const grid = {};
  for (let row = 1; row <= TOTAL_ROWS; row++) {
    grid[row] = {};
    const cols = row <= 4 ? BUSINESS_COLS : COLS;
    for (const col of cols) {
      grid[row][col] = {
        id: `${row}${col}`,
        row,
        col,
        type: getSeatType(row),
        occupied: isSeatOccupied(row, col),
      };
    }
  }
  return grid;
}

const SEAT_GRID = generateSeats();

// Section dividers: row number → label shown above that row
const SECTION_LABELS = { 1: 'Business Class', 5: 'Premium Economy', 11: 'Economy' };

// Exit-row indicators shown above these rows (when no section label already shown)
const EXIT_BEFORE_ROWS = [11, 21];

// Per-passenger ring colours — used as the outer glow on selected seats.
const P_COLORS = [
  { ring: '#FFFFFF' },
  { ring: '#4C6EF5' },
  { ring: '#2ECC71' },
  { ring: '#F59F00' },
  { ring: '#FA5252' },
  { ring: '#CC5DE8' },
];

// Cabin-class fill colours for selected seats.
const CABIN_SELECTED = {
  business: { bg: '#C9A84C', text: '#1A1200' }, // deep champagne / muted gold
  premium:  { bg: '#4A62B8', text: '#FFFFFF' }, // luxury sapphire
  economy:  { bg: '#FFFFFF', text: '#141313' }, // clean white
};

// ─── SeatButton ───────────────────────────────────────────────────────────────

function SeatButton({ seat, selInfo, onClick }) {
  // Render an invisible spacer for missing seats (business class C / D slots)
  if (!seat) return <div className="w-8 h-9 flex-shrink-0" />;

  const { selected, pIdx } = selInfo;
  const { occupied, type, col, id } = seat;

  const base =
    'w-8 h-9 flex-shrink-0 rounded-md flex items-center justify-center text-[10px] font-bold border select-none transition-colors duration-150';

  let cls = base;
  let style = {};

  if (occupied) {
    // Visible muted grey — clear enough to read the layout, still clearly blocked
    cls += ' bg-[#2A2A2A] border-[#383838] cursor-not-allowed opacity-50';
  } else if (selected) {
    // Fill = cabin class accent; ring = passenger identity
    const cabinFill = CABIN_SELECTED[type] ?? CABIN_SELECTED.economy;
    const passengerRing = P_COLORS[pIdx % P_COLORS.length].ring;
    cls += ' cursor-pointer';
    style = {
      backgroundColor: cabinFill.bg,
      color: cabinFill.text,
      borderColor: cabinFill.bg,
      boxShadow: `0 0 0 2px #141313, 0 0 0 3.5px ${passengerRing}`,
    };
  } else if (type === 'business') {
    // Deep champagne / muted gold
    cls +=
      ' bg-[#1C1608] border-[#8B6914] hover:border-[#C9A84C] hover:bg-[#231C09] text-[#A07820] cursor-pointer';
  } else if (type === 'premium') {
    // Luxury deep sapphire
    cls +=
      ' bg-[#0C1020] border-[#2A3A72] hover:border-[#4A62B8] hover:bg-[#111828] text-[#6A82C8] cursor-pointer';
  } else {
    cls +=
      ' bg-[#1A1A1A] border-[#2C2C2C] hover:border-[#4A4A4A] hover:bg-[#222222] text-outline cursor-pointer';
  }

  return (
    <button
      onClick={() => !occupied && onClick(seat)}
      disabled={occupied}
      title={`Seat ${id}${
        occupied
          ? ' — Occupied'
          : type !== 'economy'
          ? ` — ${type.charAt(0).toUpperCase() + type.slice(1)}`
          : ''
      }`}
      style={style}
      className={cls}
    >
      {!occupied && col}
    </button>
  );
}

// ─── Legend item ──────────────────────────────────────────────────────────────

function LegendItem({ label, bg, border, opacity = 1, dot }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: bg, border: `1.5px solid ${border}`, opacity }}
      >
        {dot && (
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
        )}
      </div>
      <span className="text-[11px] text-outline">{label}</span>
    </div>
  );
}

// ─── SeatMap (default export) ─────────────────────────────────────────────────

/**
 * @param {number}   passengers      Total number of passengers
 * @param {Array}    selectedSeats   Array[passengerIdx] = { id, row, col, type } | null
 * @param {Function} onSeatSelect    (passengerIdx, seat | null) => void
 * @param {number}   activePassenger Currently-selecting passenger index
 */
export default function SeatMap({ passengers, selectedSeats, onSeatSelect, activePassenger }) {
  const getSelInfo = (seatId) => {
    for (let i = 0; i < passengers; i++) {
      if (selectedSeats[i]?.id === seatId) return { selected: true, pIdx: i };
    }
    return { selected: false, pIdx: -1 };
  };

  const handleClick = (seat) => {
    const { selected, pIdx } = getSelInfo(seat.id);
    if (selected && pIdx === activePassenger) {
      // Tap again to deselect
      onSeatSelect(activePassenger, null);
    } else if (!selected) {
      onSeatSelect(activePassenger, seat);
    }
    // Seat owned by another passenger → no-op (can't steal)
  };

  return (
    <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-6 overflow-x-auto">
      {/* Single centered column — everything shares one alignment axis */}
      <div className="flex flex-col items-center">

        {/* ── Aircraft nose ── */}
        <div className="flex flex-col items-center mb-6">
          <svg width="56" height="28" viewBox="0 0 56 28" fill="none">
            <path
              d="M28 2 C14 2, 3 14, 3 27 L53 27 C53 14, 42 2, 28 2 Z"
              fill="#1A1A1A"
              stroke="#3C3C3C"
              strokeWidth="1.5"
            />
            <line x1="3" y1="27" x2="53" y2="27" stroke="#3C3C3C" strokeWidth="1.5" />
          </svg>
          <span className="text-[9px] text-[#606060] tracking-[0.3em] uppercase mt-1">nose</span>
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mb-6">
          <LegendItem label="Available" bg="#1A1A1A" border="#505050" />
          <LegendItem label="Your Seat" bg="#FFFFFF" border="#FFFFFF" />
          <LegendItem label="Occupied" bg="#2A2A2A" border="#383838" opacity={0.5} />
        <LegendItem label="Business" bg="#1C1608" border="#8B6914" dot="#C9A84C" />
        <LegendItem label="Premium" bg="#0C1020" border="#2A3A72" dot="#4A62B8" />
        </div>

        {/* ── Aircraft body: col headers + seat rows ── */}
        {/* This div sizes itself to its content (the seat grid).
            Section dividers inside use flex-1 lines which fill exactly this width. */}
        <div>
          {/* Column header row — spacer mimics the row-number prefix in each seat row */}
          <div className="flex items-center gap-1 mb-2">
            <div className="w-7 mr-1 flex-shrink-0" /> {/* row-number spacer */}
            <div className="flex gap-1">
              {['A', 'B', 'C'].map((c) => (
                <div key={c} className="w-8 flex-shrink-0 text-center text-[10px] text-[#444] font-semibold">
                  {c}
                </div>
              ))}
            </div>
            <div className="w-8 flex-shrink-0 text-center text-[9px] text-[#2E2E2E] uppercase tracking-widest">
              aisle
            </div>
            <div className="flex gap-1">
              {['D', 'E', 'F'].map((c) => (
                <div key={c} className="w-8 flex-shrink-0 text-center text-[10px] text-[#444] font-semibold">
                  {c}
                </div>
              ))}
            </div>
          </div>

          {/* ── Rows ── */}
          <div className="flex flex-col gap-1">
            {Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1).map((row) => {
              const rowSeats = SEAT_GRID[row];
              const sectionLabel = SECTION_LABELS[row];
              const showExit = EXIT_BEFORE_ROWS.includes(row) && !sectionLabel;

              return (
                <div key={row}>
                  {/* Section divider — left spacer mirrors the row-number gutter so
                      the lines start and end flush with the seat columns */}
                  {sectionLabel && (
                    <div className="flex items-center gap-2 my-4">
                      <div className="w-7 mr-1 flex-shrink-0" />
                      <div className="flex-1 h-px bg-[#252525]" />
                      <span className="text-[10px] text-[#454545] uppercase tracking-[0.18em] font-semibold whitespace-nowrap px-1">
                        {sectionLabel}
                      </span>
                      <div className="flex-1 h-px bg-[#252525]" />
                    </div>
                  )}

                  {/* Exit row marker — same gutter offset as section dividers */}
                  {showExit && (
                    <div className="flex items-center gap-2 my-2">
                      <div className="w-7 mr-1 flex-shrink-0" />
                      <div className="flex-1 border-t border-dashed border-[#2A2A2A]" />
                      <span className="text-[9px] text-[#3A3A3A] uppercase tracking-widest px-1">
                        Exit Row
                      </span>
                      <div className="flex-1 border-t border-dashed border-[#2A2A2A]" />
                    </div>
                  )}

                  {/* Seat row */}
                  <div className="flex items-center gap-1">
                    {/* Row number */}
                    <div className="w-7 text-right text-[10px] text-[#383838] flex-shrink-0 mr-1 select-none tabular-nums">
                      {row}
                    </div>

                    {/* Left: A B C */}
                    <div className="flex gap-1">
                      {['A', 'B', 'C'].map((col) => (
                        <SeatButton
                          key={col}
                          seat={rowSeats[col] ?? null}
                          selInfo={
                            rowSeats[col]
                              ? getSelInfo(rowSeats[col].id)
                              : { selected: false, pIdx: -1 }
                          }
                          onClick={handleClick}
                        />
                      ))}
                    </div>

                    {/* Aisle gap */}
                    <div className="w-8 flex-shrink-0" />

                    {/* Right: D E F */}
                    <div className="flex gap-1">
                      {['D', 'E', 'F'].map((col) => (
                        <SeatButton
                          key={col}
                          seat={rowSeats[col] ?? null}
                          selInfo={
                            rowSeats[col]
                              ? getSelInfo(rowSeats[col].id)
                              : { selected: false, pIdx: -1 }
                          }
                          onClick={handleClick}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Tail ── */}
        <div className="flex flex-col items-center mt-6">
          <span className="text-[9px] text-[#606060] tracking-[0.3em] uppercase mb-1">tail</span>
          <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
            <path
              d="M3 2 L53 2 C53 14, 42 18, 28 18 C14 18, 3 14, 3 2 Z"
              fill="#1A1A1A"
              stroke="#3C3C3C"
              strokeWidth="1.5"
            />
          </svg>
        </div>

      </div>
    </div>
  );
}
