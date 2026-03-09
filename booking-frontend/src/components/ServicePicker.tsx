import { Scissors, Clock } from "lucide-react";
import type { Service } from "@/lib/api";

interface Props {
  services: Service[];
  selected: Service | null;
  onSelect: (s: Service) => void;
}

export default function ServicePicker({ services, selected, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-white mb-4">
        Elige tu servicio
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((s) => {
          const isActive = selected?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                isActive
                  ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500"
                  : "border-zinc-700 bg-zinc-800/60 hover:border-zinc-500 hover:bg-zinc-800"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-white">
                  <Scissors className="h-4 w-4 text-amber-400" />
                  {s.name}
                </span>
                <span className="text-amber-400 font-bold">
                  {s.price_eur.toFixed(0)} &euro;
                </span>
              </div>
              {s.description && (
                <p className="text-sm text-zinc-400">{s.description}</p>
              )}
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="h-3 w-3" />
                {s.duration_minutes} min
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
