import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { GlassCard, CardContent } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Subscription, Customer } from "@shared/schema";
import { CalendarDays, RefreshCw, User } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge variant="default">Active</Badge>;
  if (status === "paused") return <Badge variant="secondary">Paused</Badge>;
  return <Badge variant="destructive">Cancelled</Badge>;
}

function SubscriptionCard({ sub, customers }: { sub: Subscription; customers: Customer[] }) {
  const customer = customers.find((c) => c.id === sub.customerId);
  return (
    <Link href={`/subscriptions/${sub.id}`}>
      <GlassCard className="hover:bg-white/15 transition-all cursor-pointer" data-testid={`card-sub-${sub.id}`}>
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-white/70" />
                  <p className="text-sm font-medium text-white">{customer?.name || "Unknown"}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/70 mt-0.5">
                  <RefreshCw className="h-3 w-3" />
                  <span className="capitalize">{sub.frequency}</span>
                  <span className="text-white/30">|</span>
                  <CalendarDays className="h-3 w-3" />
                  Started {sub.startDate}
                </div>
              </div>
            </div>
            <StatusBadge status={sub.status} />
          </div>
        </CardContent>
      </GlassCard>
    </Link>
  );
}

export default function SubscriptionsListPage() {
  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-lg" data-testid="text-page-title">Subscriptions</h1>
        <p className="text-sm text-white/70 mt-1">{subscriptions.length} subscriptions</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full bg-white/10" />)}
        </div>
      )}

      {!isLoading && subscriptions.length === 0 && (
        <GlassCard>
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-10 w-10 mx-auto text-white/50 mb-3" />
            <p className="text-white/70">No subscriptions yet.</p>
          </CardContent>
        </GlassCard>
      )}

      <div className="space-y-2">
        {subscriptions.map((sub) => (
          <SubscriptionCard key={sub.id} sub={sub} customers={customers} />
        ))}
      </div>
    </div>
  );
}
