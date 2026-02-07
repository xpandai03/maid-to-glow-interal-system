import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { GlassCard, CardContent, CardHeader, CardTitle } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Subscription, Job, Customer } from "@shared/schema";
import { ArrowLeft, CalendarDays, RefreshCw, DollarSign, XCircle, User } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge variant="default">Active</Badge>;
  if (status === "paused") return <Badge variant="secondary">Paused</Badge>;
  return <Badge variant="destructive">Cancelled</Badge>;
}

function JobStatusBadge({ status }: { status: string }) {
  const variant = status === "scheduled" ? "default" : status === "completed" ? "secondary" : "destructive";
  return <Badge variant={variant} className="text-xs">{status}</Badge>;
}

export default function SubscriptionDetailPage() {
  const [, params] = useRoute("/subscriptions/:id");
  const subId = params?.id;
  const { toast } = useToast();

  const { data: subscription, isLoading: subLoading } = useQuery<Subscription>({
    queryKey: ["/api/subscriptions", subId],
    enabled: !!subId,
  });

  const { data: customer } = useQuery<Customer>({
    queryKey: ["/api/customers", subscription?.customerId],
    enabled: !!subscription?.customerId,
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/subscriptions", subId, "jobs"],
    enabled: !!subId,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/subscriptions/${subId}/cancel`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions", subId] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions", subId, "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Subscription cancelled", description: "Future jobs have been marked as cancelled." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (subLoading) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48 bg-white/10" />
        <Skeleton className="h-32 w-full bg-white/10" />
        <Skeleton className="h-64 w-full bg-white/10" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto text-center space-y-4">
        <h1 className="text-xl font-semibold text-white">Subscription not found</h1>
        <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
          <Link href="/subscriptions"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Link>
        </Button>
      </div>
    );
  }

  const sortedJobs = [...jobs].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/10">
          <Link href="/subscriptions" data-testid="link-back-subs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-lg" data-testid="text-sub-title">Subscription</h1>
            <StatusBadge status={subscription.status} />
          </div>
          <p className="text-sm text-white/70 mt-0.5">ID: {subscription.id.slice(0, 8)}...</p>
        </div>
        {subscription.status === "active" && (
          <Button
            variant="destructive"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            data-testid="button-cancel-subscription"
          >
            <XCircle className="h-4 w-4 mr-2" />
            {cancelMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
          </Button>
        )}
      </div>

      <GlassCard>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-white"><RefreshCw className="h-4 w-4" /> Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-0.5 text-white/70" />
              <div>
                <p className="text-sm font-medium text-white">Customer</p>
                <p className="text-sm text-white/70" data-testid="text-sub-customer">{customer?.name || "Loading..."}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RefreshCw className="h-4 w-4 mt-0.5 text-white/70" />
              <div>
                <p className="text-sm font-medium text-white">Frequency</p>
                <p className="text-sm text-white/70 capitalize" data-testid="text-sub-frequency">{subscription.frequency}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays className="h-4 w-4 mt-0.5 text-white/70" />
              <div>
                <p className="text-sm font-medium text-white">Start Date</p>
                <p className="text-sm text-white/70" data-testid="text-sub-start">{subscription.startDate}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-white"><CalendarDays className="h-4 w-4" /> Scheduled Jobs ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedJobs.length === 0 ? (
            <p className="text-sm text-white/70 text-center py-6">No jobs for this subscription.</p>
          ) : (
            <div className="space-y-2">
              {sortedJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-md border border-white/20 hover:bg-white/10 transition-all cursor-pointer" data-testid={`row-sub-job-${job.id}`}>
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-white/70" />
                      <div>
                        <p className="text-sm font-medium text-white">{job.scheduledDate}</p>
                        <p className="text-xs text-white/70">{job.arrivalWindow}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-white flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />{job.priceSnapshot.toFixed(2)}
                      </span>
                      <JobStatusBadge status={job.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </GlassCard>
    </div>
  );
}
