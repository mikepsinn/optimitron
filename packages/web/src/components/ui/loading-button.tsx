import * as React from "react"
import { Loader2, type LucideIcon } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type VariantProps } from "class-variance-authority"

export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
  icon?: LucideIcon
  asChild?: boolean
}

export function LoadingButton({
  loading = false,
  loadingText,
  icon: Icon,
  children,
  disabled,
  className,
  variant,
  size,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      variant={variant}
      size={size}
      className={cn(
        loading && "cursor-not-allowed",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          {loadingText || children}
        </>
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5 mr-2" />}
          {children}
        </>
      )}
    </Button>
  )
}
