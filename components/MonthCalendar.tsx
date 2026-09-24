"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type Props = {
  value: string | null;
  onChange: (dateStr: string) => void;
  closedDays: Set<number>;
};

function toStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function monthLabel(d: Date): string {
  const label = d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function MonthCalendar({ value, onChange, closedDays }: Props) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const maxStart = new Date(now.getFullYear(), now.getMonth() + 6, 1);

  const [view, setView] = useState<Date>(todayStart);

  const canPrev = view.getFullYear() > todayStart.getFullYear() ||
    (view.getFullYear() === todayStart.getFullYear() && view.getMonth() > todayStart.getMonth());
  const canNext = view.getFullYear() < maxStart.getFullYear() ||
    (view.getFullYear() === maxStart.getFullYear() && view.getMonth() < maxStart.getMonth());

  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const offset = (view.getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-ivory/60 rounded-[4px] border border-stone-200 p-3.5 sm:p-4">
      <div className="flex items-center justify-between mb-2.5">
        <button
          type="button"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          disabled={!canPrev}
          aria-label="Mes anterior"
          className="p-1 text-stone-500 hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-serif text-base sm:text-lg text-ink font-bold">{monthLabel(view)}</p>
        <button
          type="button"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          disabled={!canNext}
          aria-label="Mes siguiente"
          className="p-1 text-stone-500 hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <p key={w} className="text-center text-[10px] sm:text-[11px] uppercase tracking-wide text-stone-500 font-medium">
            {w}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const dateStr = toStr(view.getFullYear(), view.getMonth(), day);
          const cellDate = new Date(view.getFullYear(), view.getMonth(), day);
          const isPast = cellDate < now;
          const isClosed = closedDays.has(cellDate.getDay());
          const isToday = cellDate.getTime() === now.getTime();
          const isSelected = value === dateStr;
          const disabled = isPast || isClosed;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onChange(dateStr)}
              aria-label={`${day} ${monthLabel(view)}`}
              className={`h-8 sm:h-9 rounded-[4px] text-xs sm:text-sm transition-all cursor-pointer ${
                isSelected
                  ? isToday
                    ? "bg-brand text-ink font-bold border-2 border-ink shadow-xs"
                    : "bg-brand text-ink font-bold shadow-xs"
                  : isToday
                    ? "bg-transparent text-ink font-bold border-2 border-ink hover:bg-stone-100"
                    : disabled
                      ? "text-stone-300 cursor-not-allowed line-through decoration-stone-200"
                      : "text-stone-700 hover:bg-stone-200/60 font-medium"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}