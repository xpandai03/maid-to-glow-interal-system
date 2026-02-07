import { CalendarDays, Plus, ClipboardList, RefreshCw, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { MiniCalendar } from "./mini-calendar";

const navItems = [
  { title: "Schedule", url: "/schedule", icon: CalendarDays },
  { title: "New Booking", url: "/book", icon: Plus },
  { title: "All Jobs", url: "/jobs", icon: ClipboardList },
  { title: "Subscriptions", url: "/subscriptions", icon: RefreshCw },
  { title: "Tech Clock-In", url: "/tech", icon: Clock },
];

interface GlassSidebarProps {
  mobile?: boolean;
}

export function GlassSidebar({ mobile }: GlassSidebarProps) {
  const [location] = useLocation();

  return (
    <div
      className={`h-full bg-white/10 backdrop-blur-lg p-4 shadow-xl border-r border-white/20 flex flex-col ${
        mobile ? "" : "hidden md:flex w-64 rounded-tr-3xl opacity-0 animate-fade-in"
      }`}
      style={mobile ? undefined : { animationDelay: "0.4s" }}
    >
      <div className="flex-1">
        {/* Mini Calendar */}
        <MiniCalendar />

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              location === item.url ||
              (item.url !== "/" && location.startsWith(item.url));
            return (
              <Link key={item.title} href={item.url}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-white/20 text-white font-medium"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.title}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
