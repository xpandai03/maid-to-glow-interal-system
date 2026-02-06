import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Job, TimeLog, Customer } from "@shared/schema";
import { Clock, Play, Square, MapPin, CalendarDays, DollarSign, Timer } from "lucide-react";

export default function TechClockPage() {
  const { toast } = useToast();
  const [elapsed, setElapsed] = useState(0);
  const [activeLog, setActiveLog] = useState<TimeLog | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const { data: todayJobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs/today"],
  });

  const { data: timeLogs = [], isLoading: logsLoading } = useQuery<TimeLog[]>({
    queryKey: ["/api/timelogs"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  useEffect(() => {
    const current = timeLogs.find((tl) => tl.clockInTime && !tl.clockOutTime);
    setActiveLog(current || null);
  }, [timeLogs]);

  useEffect(() => {
    if (!activeLog?.clockInTime) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      const start = new Date(activeLog.clockInTime!).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeLog]);

  const clockInMutation = useMutation({
    mutationFn: async (jobId: string) => {
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {}
      const res = await apiRequest("POST", "/api/timelogs/clock-in", { jobId, lat, lng });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timelogs"] });
      toast({ title: "Clocked in", description: "Timer started." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (logId: string) => {
      const res = await apiRequest("POST", `/api/timelogs/${logId}/clock-out`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timelogs"] });
      toast({ title: "Clocked out", description: "Time recorded." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
  };

  const isLoading = jobsLoading || logsLoading;

  const scheduledJobs = todayJobs.filter((j) => j.status === "scheduled");

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">Tech Clock-In</h1>
        <p className="text-sm text-muted-foreground mt-1">
          <CalendarDays className="h-3.5 w-3.5 inline mr-1" />
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!isLoading && activeLog && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-base flex items-center justify-center gap-2">
              <Timer className="h-4 w-4 text-primary" /> Active Session
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-5xl font-mono font-bold tabular-nums tracking-wider" data-testid="text-timer">
              {formatElapsed(elapsed)}
            </div>
            <p className="text-sm text-muted-foreground">
              Started at {activeLog.clockInTime ? formatTime(activeLog.clockInTime) : ""}
            </p>
            {activeLog.lat && activeLog.lng && (
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {activeLog.lat.toFixed(4)}, {activeLog.lng.toFixed(4)}
              </div>
            )}
            <Button
              size="lg"
              variant="destructive"
              className="w-full text-lg py-6"
              onClick={() => clockOutMutation.mutate(activeLog.id)}
              disabled={clockOutMutation.isPending}
              data-testid="button-clock-out"
            >
              <Square className="h-5 w-5 mr-2" />
              {clockOutMutation.isPending ? "Stopping..." : "Clock Out"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !activeLog && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Today's Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {scheduledJobs.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No scheduled jobs for today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledJobs.map((job) => {
                  const cust = customers.find((c) => c.id === job.customerId);
                  return (
                    <div key={job.id} className="p-3 border rounded-md space-y-3" data-testid={`card-tech-job-${job.id}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-sm font-medium">{cust?.name || "Customer"}</p>
                          <p className="text-xs text-muted-foreground">{cust?.address || ""}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">{job.arrivalWindow}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{job.priceSnapshot.toFixed(2)}</span>
                      </div>
                      <Button
                        className="w-full text-lg py-6"
                        onClick={() => clockInMutation.mutate(job.id)}
                        disabled={clockInMutation.isPending}
                        data-testid={`button-clock-in-${job.id}`}
                      >
                        <Play className="h-5 w-5 mr-2" />
                        {clockInMutation.isPending ? "Starting..." : "Clock In"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Recent Time Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {timeLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No time logs yet.</p>
          ) : (
            <div className="space-y-2">
              {timeLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 rounded-md border text-sm" data-testid={`row-timelog-${log.id}`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Play className="h-3 w-3 text-green-500" />
                      <span>{log.clockInTime ? formatTime(log.clockInTime) : "-"}</span>
                      {log.clockOutTime && (
                        <>
                          <span className="text-muted-foreground">to</span>
                          <Square className="h-3 w-3 text-red-500" />
                          <span>{formatTime(log.clockOutTime)}</span>
                        </>
                      )}
                    </div>
                    {log.lat && log.lng && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5" />
                        {log.lat.toFixed(4)}, {log.lng.toFixed(4)}
                      </div>
                    )}
                  </div>
                  {!log.clockOutTime && (
                    <Badge variant="default" className="text-xs">Active</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
