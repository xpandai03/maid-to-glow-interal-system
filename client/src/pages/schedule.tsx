import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job, Customer } from "@shared/schema";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM
const PX_PER_HOUR = 80;

function getWeekDates(reference: Date): Date[] {
  const d = new Date(reference);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
}

function formatDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function parseArrivalWindow(window: string): { startHour: number; endHour: number } {
  const parts = window.split(" - ");
  if (parts.length !== 2) return { startHour: 9, endHour: 11 };

  const parseTime = (t: string): number => {
    const match = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 9;
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    return hour + minute / 60;
  };

  return {
    startHour: parseTime(parts[0]),
    endHour: parseTime(parts[1]),
  };
}

function calculateEventStyle(startHour: number, endHour: number) {
  const top = (startHour - 8) * PX_PER_HOUR;
  const height = (endHour - startHour) * PX_PER_HOUR;
  return { top: `${top}px`, height: `${Math.max(height, 30)}px` };
}

function getStatusColor(status: string) {
  if (status === "scheduled") return "bg-blue-500";
  if (status === "completed") return "bg-green-500";
  return "bg-red-500/80";
}

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [currentView, setCurrentView] = useState("week");

  const referenceDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(referenceDate), [referenceDate]);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const jobsByDate = useMemo(() => {
    const map: Record<string, Job[]> = {};
    jobs.forEach((job) => {
      if (!map[job.scheduledDate]) map[job.scheduledDate] = [];
      map[job.scheduledDate].push(job);
    });
    return map;
  }, [jobs]);

  const today = formatDateKey(new Date());

  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
  const headerLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? monthFormatter.format(weekStart)
    : `${new Intl.DateTimeFormat("en-US", { month: "short" }).format(weekStart)} - ${new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(weekEnd)}`;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Calendar Controls */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setWeekOffset(0)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
            data-testid="button-today"
          >
            Today
          </Button>
          <div className="flex">
            <button
              className="p-2 text-white hover:bg-white/10 rounded-l-md transition-colors"
              onClick={() => setWeekOffset(weekOffset - 1)}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              className="p-2 text-white hover:bg-white/10 rounded-r-md transition-colors"
              onClick={() => setWeekOffset(weekOffset + 1)}
              data-testid="button-next-week"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-xl font-semibold text-white drop-shadow-lg" data-testid="text-page-title">
            {headerLabel}
          </h2>
        </div>

        <div className="flex items-center gap-1 rounded-md p-1">
          {["Day", "Week", "Month"].map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view.toLowerCase())}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                currentView === view.toLowerCase()
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Week View */}
      {isLoading ? (
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full bg-white/10 rounded-xl" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl min-h-full">
            {/* Week Header */}
            <div className="grid grid-cols-8 border-b border-white/20">
              <div className="p-2 text-center text-white/50 text-xs" />
              {weekDates.map((date, i) => {
                const key = formatDateKey(date);
                const isToday = key === today;
                return (
                  <div key={key} className="p-2 text-center border-l border-white/20">
                    <div className="text-xs text-white/70 font-medium">{DAYS[i]}</div>
                    <div
                      className={`text-lg font-medium mt-1 text-white ${
                        isToday
                          ? "bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                          : ""
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-8">
              {/* Time Labels */}
              <div className="text-white/70">
                {TIME_SLOTS.map((time) => (
                  <div key={time} className="h-20 border-b border-white/10 pr-2 text-right text-xs flex items-start justify-end pt-1">
                    {time > 12 ? `${time - 12} PM` : time === 12 ? "12 PM" : `${time} AM`}
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {weekDates.map((date, dayIndex) => {
                const key = formatDateKey(date);
                const dayJobs = jobsByDate[key] || [];
                return (
                  <div key={key} className="border-l border-white/20 relative">
                    {/* Hour grid lines */}
                    {TIME_SLOTS.map((_, timeIndex) => (
                      <div key={timeIndex} className="h-20 border-b border-white/10" />
                    ))}

                    {/* Events */}
                    {dayJobs.map((job) => {
                      const { startHour, endHour } = parseArrivalWindow(job.arrivalWindow);
                      const style = calculateEventStyle(startHour, endHour);
                      const cust = customers.find((c) => c.id === job.customerId);
                      const statusColor = getStatusColor(job.status);

                      return (
                        <Link key={job.id} href={`/jobs/${job.id}`}>
                          <div
                            className={`absolute ${statusColor} rounded-md p-2 text-white text-xs shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-lg ${
                              job.status === "cancelled" ? "opacity-60" : ""
                            }`}
                            style={{
                              ...style,
                              left: "4px",
                              right: "4px",
                            }}
                            data-testid={`block-schedule-job-${job.id}`}
                          >
                            <div className="font-medium truncate">{cust?.name || "Customer"}</div>
                            <div className="opacity-80 text-[10px] mt-0.5 truncate">
                              {job.arrivalWindow}
                            </div>
                            <div className="opacity-80 text-[10px] truncate">
                              ${job.priceSnapshot.toFixed(0)}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
