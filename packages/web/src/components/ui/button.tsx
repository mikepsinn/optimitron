import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const HARD_SHADOW =
  'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all'

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold uppercase border-2 border-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-foreground aria-invalid:border-destructive",
    HARD_SHADOW,
  ),
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive',
        outline: 'bg-background text-foreground hover:bg-muted',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary',
        ghost: 'border-transparent bg-transparent shadow-none hover:bg-muted hover:text-foreground hover:translate-x-0 hover:translate-y-0 hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-none',
        link: 'border-transparent bg-transparent shadow-none text-primary underline-offset-4 hover:underline hover:translate-x-0 hover:translate-y-0 hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-none',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'

export { Button, buttonVariants }
export type { ButtonProps }
