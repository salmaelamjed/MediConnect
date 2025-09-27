import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:scale-105",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-border hover:bg-accent",
        confirmed: "border-transparent bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm",
        cancel: "border-transparent bg-red-500 text-white hover:bg-red-600 shadow-sm",
        pending: "border-transparent bg-amber-500 text-white hover:bg-amber-600 shadow-sm",
        completed: "border-transparent bg-blue-500 text-white hover:bg-blue-600 shadow-sm",
        follow_up: "border-transparent bg-violet-500 text-white hover:bg-violet-600 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
