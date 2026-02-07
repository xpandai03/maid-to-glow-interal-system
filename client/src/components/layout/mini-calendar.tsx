import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";

export function MiniCalendar() {
  const [current, setCurrent] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(current);
    const monthEnd = endOfMonth(current);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [current]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium text-sm">
          {format(current, "MMMM yyyy")}
        </h3>
        <div className="flex gap-1">
          <button
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            onClick={() => setCurrent(subMonths(current, 1))}
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
          <button
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            onClick={() => setCurrent(addMonths(current, 1))}
          >
            <ChevronRight className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-xs text-white/70 font-medium py-1">
            {d}
          </div>
        ))}

        {days.map((day, i) => {
          const inMonth = isSameMonth(day, current);
          const today = isToday(day);
          return (
            <div
              key={i}
              className={`text-xs rounded-full w-7 h-7 flex items-center justify-center transition-colors ${
                today
                  ? "bg-blue-500 text-white font-bold"
                  : inMonth
                    ? "text-white hover:bg-white/20"
                    : "text-white/30"
              }`}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>
    </div>
  );
}
