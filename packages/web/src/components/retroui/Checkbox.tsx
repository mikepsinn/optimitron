import { cn } from "@/lib/utils";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";

const checkboxVariants = cva(
  "inline-flex aspect-square shrink-0 items-center justify-center rounded-none border-2 border-foreground bg-background align-middle leading-none text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "data-[state=checked]:bg-foreground data-[state=checked]:text-background",
        outline: "",
        solid:
          "data-[state=checked]:bg-foreground data-[state=checked]:text-background",
      },
      size: {
        sm: "h-4 max-h-4 min-h-4 w-4 min-w-4 max-w-4",
        md: "h-5 max-h-5 min-h-5 w-5 min-w-5 max-w-5",
        lg: "h-6 max-h-6 min-h-6 w-6 min-w-6 max-w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

interface CheckboxProps
  extends
    React.ComponentProps<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {}

export const Checkbox = ({
  className,
  size,
  variant,
  ...props
}: CheckboxProps) => (
  <CheckboxPrimitive.Root
    className={cn(
      checkboxVariants({
        size,
        variant,
      }),
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex h-full w-full items-center justify-center">
      <Check className="h-4/5 w-4/5 stroke-[3]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);
