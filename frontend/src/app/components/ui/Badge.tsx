"use client";
import { HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-105 animate-scale-in",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5",
        secondary: "border-transparent bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 hover:from-blue-200 hover:to-blue-300 shadow-sm hover:shadow-md",
        success: "border-transparent bg-gradient-to-r from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300 shadow-sm hover:shadow-md",
        destructive: "border-transparent bg-gradient-to-r from-red-100 to-red-200 text-red-800 hover:from-red-200 hover:to-red-300 shadow-sm hover:shadow-md",
        warning: "border-transparent bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 hover:from-yellow-200 hover:to-yellow-300 shadow-sm hover:shadow-md",
        outline: "border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 backdrop-blur-sm",
        premium: "border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-size-200 text-white animate-gradient shadow-lg hover:shadow-xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      >
        <span className="relative z-10">
          {children}
        </span>
      </div>
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }