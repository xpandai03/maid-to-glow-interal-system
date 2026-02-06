import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job, Customer } from "@shared/schema";
import { ChevronLeft, ChevronRight, CalendarDays, DollarSign, Clock } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

function StatusDot({ status }: { status: string }) {
  const color = status === "scheduled" ? "bg-primary" : status === "completed" ? "bg-green-500" : "bg-destructive";
  return <div className={`h-2 w-2 rounded-full ${color}`} />;
}

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);

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
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">Week view of all jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(weekOffset - 1)} data-testid="button-prev-week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)} data-testid="button-today">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(weekOffset + 1)} data-testid="button-next-week">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground" data-testid="text-week-range">{headerLabel}</p>
      </div>

      {isLoading && <Skeleton className="h-96 w-full" />}

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const key = formatDateKey(date);
            const dayJobs = jobsByDate[key] || [];
            const isToday = key === today;

            return (
              <div key={key} className="min-h-[140px]">
                <div className={`text-center py-1.5 rounded-md mb-1 ${isToday ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <p className="text-xs font-medium">{DAYS[i]}</p>
                  <p className={`text-lg font-semibold ${isToday ? "" : "text-foreground"}`}>{date.getDate()}</p>
                </div>
                <div className="space-y-1.5">
                  {dayJobs.map((job) => {
                    const cust = customers.find((c) => c.id === job.customerId);
                    return (
                      <Link key={job.id} href={`/jobs/${job.id}`}>
                        <div
                          className={`p-2 rounded-md border text-xs hover-elevate cursor-pointer ${
                            job.status === "cancelled" ? "opacity-50" : ""
                          }`}
                          data-testid={`block-schedule-job-${job.id}`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <StatusDot status={job.status} />
                            <span className="font-medium truncate">{cust?.name || "Customer"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            <span className="truncate">{job.arrivalWindow.split(" - ")[0]}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                            <DollarSign className="h-2.5 w-2.5" />
                            {job.priceSnapshot.toFixed(0)}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
