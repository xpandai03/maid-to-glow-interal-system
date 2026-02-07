import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { GlassCard, CardContent } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job } from "@shared/schema";
import { Plus, CalendarDays, DollarSign, ClipboardList } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const variant = status === "scheduled" ? "default" : status === "completed" ? "secondary" : "destructive";
  return <Badge variant={variant}>{status}</Badge>;
}

export default function JobsListPage() {
  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const sorted = [...jobs].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-lg" data-testid="text-page-title">All Jobs</h1>
          <p className="text-sm text-white/70 mt-1">{jobs.length} total jobs</p>
        </div>
        <Button asChild>
          <Link href="/book" data-testid="link-new-booking">
            <Plus className="h-4 w-4 mr-2" /> New Booking
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full bg-white/10" />)}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <GlassCard>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-10 w-10 mx-auto text-white/50 mb-3" />
            <p className="text-white/70">No jobs yet. Create your first booking.</p>
            <Button className="mt-4" asChild>
              <Link href="/book">
                <Plus className="h-4 w-4 mr-2" /> Create Booking
              </Link>
            </Button>
          </CardContent>
        </GlassCard>
      )}

      <div className="space-y-2">
        {sorted.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <GlassCard className="hover:bg-white/15 transition-all cursor-pointer" data-testid={`card-job-${job.id}`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-medium text-white">Job #{job.id.slice(0, 8)}</p>
                      <div className="flex items-center gap-2 text-xs text-white/70 mt-0.5">
                        <CalendarDays className="h-3 w-3" />
                        {job.scheduledDate}
                        <span className="text-white/30">|</span>
                        {job.arrivalWindow}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-semibold text-white">
                        <DollarSign className="h-3 w-3" />
                        {job.priceSnapshot.toFixed(2)}
                      </div>
                      <p className="text-xs text-white/70 capitalize">{job.frequency}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
