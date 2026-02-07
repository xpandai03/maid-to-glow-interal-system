import { Search, Settings, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GlassSidebar } from "./glass-sidebar";

export function GlassHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 md:px-8 py-4 md:py-6 opacity-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center gap-4">
        {/* Mobile sidebar trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="md:hidden p-1" data-testid="button-sidebar-toggle">
              <Menu className="h-6 w-6 text-white" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-black/40 backdrop-blur-xl border-white/20">
            <GlassSidebar mobile />
          </SheetContent>
        </Sheet>
        <img
          src="/maid-to-glow-logo.png?v=2"
          alt="MaidtoGlow"
          className="h-10 md:h-12 w-auto object-contain drop-shadow-lg"
          data-testid="logo-app"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
          <input
            type="text"
            placeholder="Search"
            className="rounded-full bg-white/10 backdrop-blur-sm pl-10 pr-4 py-2 text-white placeholder:text-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
          />
        </div>
        <Settings className="h-5 w-5 text-white drop-shadow-md cursor-pointer hover:text-white/80 transition-colors" />
        <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
          M
        </div>
      </div>
    </header>
  );
}
