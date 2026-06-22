import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-[background-color,color,box-shadow,transform,border-color] duration-150 ease-out hover:ring-1 hover:ring-border/70 dark:hover:ring-slate-500/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] active:duration-75 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-sm hover:from-primary/95 hover:to-primary/80 hover:shadow-lg hover:shadow-primary/25",
        destructive:
          "bg-gradient-to-b from-destructive to-destructive/90 text-destructive-foreground shadow-sm hover:from-destructive/95 hover:to-destructive/80 hover:shadow-lg hover:shadow-destructive/20",
        outline: "border border-input bg-background shadow-sm hover:border-primary/40 hover:bg-accent hover:text-accent-foreground hover:shadow-lg",
        secondary: "bg-gradient-to-b from-secondary to-secondary/90 text-secondary-foreground shadow-sm hover:from-secondary/95 hover:to-secondary/75 hover:shadow-lg",
        ghost: "hover:border-input hover:bg-accent hover:text-accent-foreground hover:shadow-md",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10 rounded-full hover:ring-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
