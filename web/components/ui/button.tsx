import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Primary — amber gold fill */
        default:
          "bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 active:scale-[0.98]",
        /** Destructive */
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/85 active:scale-[0.98]",
        /** Outlined — uses border token */
        outline:
          "border border-border bg-transparent text-foreground hover:bg-secondary hover:border-border/60 active:scale-[0.98]",
        /** Subtle fill */
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70 active:scale-[0.98]",
        /** Borderless ghost */
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-white/[0.06] active:scale-[0.98]",
        /** Text link */
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto",
        /** Cinematic gold outline — for premium CTAs */
        "gold-outline":
          "border border-primary/50 bg-primary/[0.08] text-primary hover:bg-primary/[0.14] hover:border-primary/70 active:scale-[0.98] shadow-sm shadow-primary/10",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 rounded-md px-3 text-xs",
        lg: "h-11 rounded-xl px-7 text-[0.9375rem]",
        xl: "h-12 rounded-xl px-8 text-base font-semibold",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7 rounded-md",
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
    VariantProps<typeof buttonVariants> {}

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
