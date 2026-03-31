import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import React, { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";

export const buttonVariants = cva(
  "font-head transition-all rounded-none outline-hidden cursor-pointer duration-200 font-medium flex items-center",
  {
    variants: {
      variant: {
        default:
          "shadow-sm hover:shadow-none active:shadow-none bg-primary text-primary-foreground border-2 border-border transition hover:translate-y-1 active:translate-y-2 active:translate-x-1 hover:bg-primary-hover",
        secondary:
          "shadow-sm hover:shadow-none active:shadow-none bg-secondary shadow-primary text-secondary-foreground border-2 border-border transition hover:translate-y-1 active:translate-y-2 active:translate-x-1 hover:bg-secondary-hover",
        destructive:
          "shadow-sm hover:shadow-none active:shadow-none bg-destructive text-white border-2 border-border transition hover:translate-y-1 active:translate-y-2 active:translate-x-1 hover:bg-destructive/90",
        outline:
          "shadow-sm hover:shadow-none active:shadow-none bg-transparent text-foreground border-2 transition hover:translate-y-1 active:translate-y-2 active:translate-x-1",
        link: "bg-transparent text-foreground hover:underline",
        ghost: "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        pixel:
          "font-pixel text-xs uppercase bg-[var(--sierra-muted,#555)] text-[var(--sierra-fg,#aaa)] border-2 border-[var(--sierra-border,#555)] shadow-[inset_-2px_-2px_0_#333,inset_2px_2px_0_#888,4px_4px_0_#000] hover:bg-[var(--sierra-border,#555)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[inset_-2px_-2px_0_#333,inset_2px_2px_0_#888,2px_2px_0_#000]"
      },
      size: {
        default: "px-4 py-1.5 text-base",
        sm: "px-3 py-1 text-sm shadow-sm hover:shadow-none",
        md: "px-4 py-1.5 text-base",
        lg: "px-6 lg:px-8 py-2 lg:py-3 text-md lg:text-lg",
        icon: "p-2",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  },
);

export interface IButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, IButtonProps>(
  (
    {
      children,
      size = "md",
      className = "",
      variant = "default",
      asChild = false,
      ...props
    }: IButtonProps,
    forwardedRef,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={forwardedRef}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);

Button.displayName = "Button";