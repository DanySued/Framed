import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        /** Gold fill — primary status */
        default:
          "bg-primary/15 text-primary border border-primary/30",
        /** Muted fill */
        secondary:
          "bg-secondary text-secondary-foreground border border-border",
        /** Red — error / destructive */
        destructive:
          "bg-destructive/15 text-red-400 border border-destructive/30",
        /** Outlined only */
        outline:
          "border border-border text-muted-foreground",
        /** Green — success / online */
        success:
          "bg-fr-green/10 text-fr-green border border-fr-green/30",
        /** Yellow — warning / pending */
        warning:
          "bg-fr-yellow/10 text-fr-yellow border border-fr-yellow/30",
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
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
