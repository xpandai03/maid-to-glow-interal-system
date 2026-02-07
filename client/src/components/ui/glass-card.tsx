import * as React from "react";
import { cn } from "@/lib/utils";
import { CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";

const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-white/10 backdrop-blur-lg border border-white/20 text-white shadow-xl rounded-xl",
      className,
    )}
    {...props}
  />
));
GlassCard.displayName = "GlassCard";

export { GlassCard, CardHeader, CardContent, CardTitle, CardFooter };
