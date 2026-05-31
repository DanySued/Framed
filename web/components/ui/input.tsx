import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Layout & shape
        "flex h-9 w-full min-w-0 rounded-lg border px-3.5 py-2 text-sm",
        // Colors
        "border-border/70 bg-secondary/60 text-foreground",
        "placeholder:text-muted-foreground/50",
        "selection:bg-primary/30 selection:text-foreground",
        // Transitions
        "transition-[border-color,box-shadow] duration-150 outline-none",
        // Focus
        "focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20",
        // File inputs
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        // Invalid
        "aria-invalid:border-destructive/60 aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
