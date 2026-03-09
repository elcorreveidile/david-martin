import { Clock } from "lucide-react";

interface Props {
  slots: string[];
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
  loading: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export default function SlotSelector({
  slots,
  selectedSlot,
  onSelect,
  loading,
}: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white mb-4">
          Elige la hora
        </h2>
        <div className="flex items-center justify-center py-8 text-zinc-400">
          <Clock className="h-5 w-5 animate-spin mr-2" />
          Consultando disponibilidad...
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white mb-4">
          Elige la hora
        </h2>
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-6 text-center text-zinc-400">
          No hay huecos disponibles para esta fecha. Prueba con otro día.
        </div>
      </div>
    );
  }

  // Group slots by hour for a cleaner layout
  const morning = slots.filter((s) => {
    const h = new Date(s).getHours();
    return h < 14;
  });
  const afternoon = slots.filter((s) => {
    const h = new Date(s).getHours();
    return h >= 14;
  });

  const renderGroup = (label: string, group: string[]) => {
    if (group.length === 0) return null;
    return (
      <div>
        <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">
          {label}
        </p>
        <div className="flex flex-wrap gap-2">
          {group.map((slot) => {
            const isActive = slot === selectedSlot;
            return (
              <button
                key={slot}
                onClick={() => onSelect(slot)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-amber-500 text-black"
                    : "border border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-amber-500/50 hover:text-white"
                }`}
              >
                {formatTime(slot)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-white mb-4">Elige la hora</h2>
      <div className="space-y-4">
        {renderGroup("Mañana", morning)}
        {renderGroup("Tarde", afternoon)}
      </div>
    </div>
  );
}
