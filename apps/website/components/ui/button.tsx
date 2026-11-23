import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rounded-lg bg-ink text-white shadow-sm hover:bg-ink/90 active:scale-[0.98]",
        primary:
          "rounded-lg bg-meadow text-white shadow-sm hover:bg-meadow-soft active:scale-[0.98]",
        secondary:
          "rounded-lg border border-black/10 bg-white text-ink shadow-sm hover:bg-black/[0.03]",
        ghost: "rounded-lg text-ink-soft hover:bg-black/[0.04] hover:text-ink",
        outline:
          "rounded-lg border border-black/10 bg-transparent text-ink hover:bg-black/[0.03]",
        link: "text-meadow underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-[15px]",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
