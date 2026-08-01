import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-transparent px-2 py-0.5 text-[11px] font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20",
  {
    variants: {
      variant: {
        default:
          "bg-secondary text-secondary-foreground",
        secondary:
          "bg-muted text-muted-foreground",
        destructive:
          "bg-destructive-subtle text-destructive",
        outline: "border-border-strong text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
