import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BackgroundImage } from "@/components/layout/background-image";
import { GlassHeader } from "@/components/layout/glass-header";
import { GlassSidebar } from "@/components/layout/glass-sidebar";
import NotFound from "@/pages/not-found";
import BookingPage from "@/pages/booking";
import JobDetailPage from "@/pages/job-detail";
import JobsListPage from "@/pages/jobs-list";
import SubscriptionDetailPage from "@/pages/subscription-detail";
import SubscriptionsListPage from "@/pages/subscriptions-list";
import SchedulePage from "@/pages/schedule";
import TechClockPage from "@/pages/tech-clock";

function Router() {
  return (
    <Switch>
      <Route path="/"><Redirect to="/schedule" /></Route>
      <Route path="/book" component={BookingPage} />
      <Route path="/jobs/:id" component={JobDetailPage} />
      <Route path="/jobs" component={JobsListPage} />
      <Route path="/subscriptions/:id" component={SubscriptionDetailPage} />
      <Route path="/subscriptions" component={SubscriptionsListPage} />
      <Route path="/schedule" component={SchedulePage} />
      <Route path="/tech" component={TechClockPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="relative min-h-screen overflow-hidden">
          <BackgroundImage />
          <GlassHeader />
          <main className="relative h-screen pt-20 flex">
            <GlassSidebar />
            <div className="flex-1 overflow-auto opacity-0 animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <Router />
            </div>
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
