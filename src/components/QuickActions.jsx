export default function QuickActions() {
  const actions = [
    { icon: "flight", label: "Track a Flight" },
    { icon: "airplane_ticket", label: "View My Trips" },
    { icon: "schedule", label: "Flight Status" }
  ];

  return (
    <div className="grid grid-cols-3 gap-element-gap">
      {actions.map((action) => (
        <button
          key={action.label}
          className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-[#1F1F1F] transition-colors h-24"
        >
          <span className="material-symbols-outlined text-primary text-2xl">{action.icon}</span>
          <span className="font-label-sm text-label-sm text-primary text-center">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
