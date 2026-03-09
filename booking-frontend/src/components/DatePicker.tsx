import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import type { BusinessHour } from "@/lib/api";

interface Props {
  businessHours: BusinessHour[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DatePicker({
  businessHours,
  selectedDate,
  onSelectDate,
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const openWeekdays = useMemo(
    () => new Set(businessHours.map((h) => h.weekday)),
    [businessHours]
  );

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  // Monday = 0 in our grid
  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-white mb-4">Elige la fecha</h2>
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            disabled={!canGoPrev}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-700 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-medium text-white">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((l) => (
            <div
              key={l}
              className="text-center text-xs font-medium text-zinc-500 py-1"
            >
              {l}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null)
              return <div key={`empty-${idx}`} className="h-9" />;

            const date = new Date(viewYear, viewMonth, day);
            const dateStr = toDateStr(date);
            const jsWeekday = date.getDay();
            // Convert JS weekday (0=Sun) to Python weekday (0=Mon)
            const pyWeekday = jsWeekday === 0 ? 6 : jsWeekday - 1;
            const isOpen = openWeekdays.has(pyWeekday);
            const isPast = date < today;
            const isDisabled = isPast || !isOpen;
            const isSelected = dateStr === selectedDate;
            const isToday = toDateStr(today) === dateStr;

            return (
              <button
                key={dateStr}
                disabled={isDisabled}
                onClick={() => onSelectDate(dateStr)}
                className={`h-9 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-amber-500 text-black"
                    : isToday
                    ? "border border-amber-500/50 text-amber-400"
                    : isDisabled
                    ? "text-zinc-600 cursor-not-allowed"
                    : "text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
