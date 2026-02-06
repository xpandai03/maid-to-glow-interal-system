import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card className="hover-elevate cursor-pointer" data-testid={`card-sub-${sub.id}`}>
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium">{customer?.name || "Unknown"}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <RefreshCw className="h-3 w-3" />
                  <span className="capitalize">{sub.frequency}</span>
                  <span className="text-muted-foreground/50">|</span>
                  <CalendarDays className="h-3 w-3" />
                  Started {sub.startDate}
                </div>
              </div>
            </div>
            <StatusBadge status={sub.status} />
          </div>
        </CardContent>
      </Card>
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
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">{subscriptions.length} subscriptions</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )}

      {!isLoading && subscriptions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No subscriptions yet.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {subscriptions.map((sub) => (
          <SubscriptionCard key={sub.id} sub={sub} customers={customers} />
        ))}
      </div>
    </div>
  );
}
