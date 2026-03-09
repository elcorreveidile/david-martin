import { CheckCircle, Calendar, Clock, Scissors, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookingResponse, Service } from "@/lib/api";

interface Props {
  booking: BookingResponse;
  service: Service;
  onReset: () => void;
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

export default function Confirmation({ booking, service, onReset }: Props) {
  const start = formatDateTime(booking.start_time);
  const end = formatDateTime(booking.end_time);

  return (
    <div className="flex flex-col items-center text-center space-y-6 py-4">
      <div className="rounded-full bg-green-500/20 p-4">
        <CheckCircle className="h-12 w-12 text-green-400" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-1">
          ¡Reserva confirmada!
        </h2>
        <p className="text-zinc-400">
          Te esperamos en David Martin Barber Shop
        </p>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-800/60 p-5 space-y-4 text-left">
        <div className="flex items-center gap-3">
          <Scissors className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-zinc-500">Servicio</p>
            <p className="text-white font-medium">{service.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-zinc-500">Fecha</p>
            <p className="text-white font-medium capitalize">{start.date}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-zinc-500">Hora</p>
            <p className="text-white font-medium">
              {start.time} – {end.time}
            </p>
          </div>
        </div>

        <div className="border-t border-zinc-700 pt-3">
          <p className="text-xs text-zinc-500">Cliente</p>
          <p className="text-white">{booking.customer_name}</p>
          {booking.customer_phone && (
            <p className="text-sm text-zinc-400">{booking.customer_phone}</p>
          )}
        </div>
      </div>

      <Button
        onClick={onReset}
        variant="outline"
        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Nueva reserva
      </Button>
    </div>
  );
}
