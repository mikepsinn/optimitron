import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border-2 border-foreground px-2 py-0.5 text-xs font-bold uppercase w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-foreground aria-invalid:border-destructive overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary [a&]:hover:opacity-90',
        secondary: 'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary [a&]:hover:opacity-90',
        destructive: 'bg-destructive text-destructive-foreground [a&]:hover:bg-destructive [a&]:hover:opacity-90',
        outline: 'bg-background text-foreground [a&]:hover:bg-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'span'

    return (
      <Comp
        data-slot="badge"
        className={cn(badgeVariants({ variant }), className)}
        ref={ref as React.Ref<HTMLSpanElement>}
        {...props}
      />
    )
  },
)

Badge.displayName = 'Badge'

export { Badge, badgeVariants }
export type { BadgeProps }
