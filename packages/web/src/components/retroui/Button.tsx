import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import React, { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";

export const buttonVariants = cva(
  "font-head flex cursor-pointer items-center rounded-none font-medium outline-hidden transition-colors duration-200 shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-border hover:bg-primary-hover",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-border hover:bg-secondary-hover",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-border hover:bg-destructive/90",
        outline:
          "bg-transparent text-foreground border-2",
        link: "bg-transparent text-foreground hover:underline",
        ghost: "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        pixel:
          "font-pixel text-xs uppercase bg-[var(--sierra-muted,#555)] text-[var(--sierra-fg,#aaa)] border-2 border-[var(--sierra-border,#555)] shadow-none hover:bg-[var(--sierra-border,#555)]",
      },
      size: {
        default: "px-4 py-1.5 text-base",
        sm: "px-3 py-1 text-sm",
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
