import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { GlassCard, CardContent, CardHeader, CardTitle } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job, Customer } from "@shared/schema";
import { ArrowLeft, CalendarDays, Clock, DollarSign, MapPin, Tag, Lock, User, Hash } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const variant = status === "scheduled" ? "default" : status === "completed" ? "secondary" : "destructive";
  return <Badge variant={variant} data-testid="badge-job-status">{status}</Badge>;
}

export default function JobDetailPage() {
  const [, params] = useRoute("/jobs/:id");
  const jobId = params?.id;

  const { data: job, isLoading: jobLoading } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
    enabled: !!jobId,
  });

  const { data: customer } = useQuery<Customer>({
    queryKey: ["/api/customers", job?.customerId],
    enabled: !!job?.customerId,
  });

  if (jobLoading) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48 bg-white/10" />
        <Skeleton className="h-64 w-full bg-white/10" />
        <Skeleton className="h-40 w-full bg-white/10" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto text-center space-y-4">
        <h1 className="text-xl font-semibold text-white">Job not found</h1>
        <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
          <Link href="/jobs">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Jobs
          </Link>
        </Button>
      </div>
    );
  }

  const extras = Array.isArray(job.extrasSnapshot) ? job.extrasSnapshot as { id: string; name: string; price: number }[] : [];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/10">
          <Link href="/jobs" data-testid="link-back-jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-lg" data-testid="text-job-title">Job Detail</h1>
            <StatusBadge status={job.status} />
          </div>
          <p className="text-sm text-white/70 mt-0.5" data-testid="text-job-id">
            ID: {job.id.slice(0, 8)}...
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-white"><CalendarDays className="h-4 w-4" /> Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CalendarDays className="h-4 w-4 mt-0.5 text-white/70" />
              <div>
                <p className="text-sm font-medium text-white">Date</p>
                <p className="text-sm text-white/70" data-testid="text-job-date">{job.scheduledDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 mt-0.5 text-white/70" />
              <div>
                <p className="text-sm font-medium text-white">Arrival Window</p>
                <p className="text-sm text-white/70" data-testid="text-job-window">{job.arrivalWindow}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-0.5 text-white/70" />
              <div>
                <p className="text-sm font-medium text-white">Customer</p>
                <p className="text-sm text-white/70" data-testid="text-job-customer">{customer?.name || "Loading..."}</p>
                <p className="text-xs text-white/50" data-testid="text-job-address">{customer?.address || ""}</p>
              </div>
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <DollarSign className="h-4 w-4" /> Pricing
              <Lock className="h-3 w-3 text-white/50" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 mt-0.5 text-white/70" />
              <div>
                <p className="text-sm font-medium text-white">Property</p>
                <p className="text-sm text-white/70" data-testid="text-job-property">
                  {job.bedrooms} bed / {job.bathrooms} bath / {job.sqft} sqft
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Tag className="h-4 w-4 mt-0.5 text-white/70" />
              <div>
                <p className="text-sm font-medium text-white">Frequency</p>
                <p className="text-sm text-white/70 capitalize" data-testid="text-job-frequency">{job.frequency}</p>
              </div>
            </div>

            {extras.length > 0 && (
              <>
                <div className="border-t border-white/20" />
                <div>
                  <p className="text-sm font-medium text-white mb-2">Extras</p>
                  <div className="flex flex-wrap gap-1.5">
                    {extras.map((ex) => (
                      <Badge key={ex.id} variant="secondary" className="text-xs">
                        {ex.name} (${ex.price})
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="border-t border-white/20" />
            <div className="flex justify-between items-baseline" data-testid="text-job-price">
              <span className="text-sm font-medium text-white flex items-center gap-1">
                <Lock className="h-3 w-3" /> Locked Price
              </span>
              <span className="text-2xl font-bold text-white">${job.priceSnapshot.toFixed(2)}</span>
            </div>
            <p className="text-xs text-white/50">
              This price was locked at booking and cannot be changed.
            </p>
          </CardContent>
        </GlassCard>
      </div>

      {job.subscriptionId && (
        <GlassCard>
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-white/70" />
                <span className="text-sm text-white">Part of subscription</span>
                <Badge variant="secondary">{job.subscriptionId.slice(0, 8)}</Badge>
              </div>
              <Button variant="outline" size="sm" asChild className="border-white/20 text-white hover:bg-white/10">
                <Link href={`/subscriptions/${job.subscriptionId}`} data-testid="link-subscription">
                  View Subscription
                </Link>
              </Button>
            </div>
          </CardContent>
        </GlassCard>
      )}
    </div>
  );
}
