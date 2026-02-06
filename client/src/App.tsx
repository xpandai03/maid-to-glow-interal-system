import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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
      <Route path="/"><Redirect to="/book" /></Route>
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
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0">
              <header className="flex items-center gap-2 p-2 border-b sticky top-0 z-50 bg-background">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              </header>
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
