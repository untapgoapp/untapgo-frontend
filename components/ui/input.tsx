import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-control border border-input bg-surface px-3.5 py-2 text-base text-foreground outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-quiet-foreground focus-visible:border-primary/45 focus-visible:ring-[3px] focus-visible:ring-ring/12 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
