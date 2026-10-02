import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "navy" | "danger";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold tracking-tight rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]";

    const variantStyles = {
      primary:
        "bg-[var(--color-brand-orange)] text-white hover:bg-[var(--color-brand-orange-hover)] shadow-sm hover:shadow",
      secondary:
        "bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border-strong)] hover:bg-[var(--color-bg-subtle)] hover:border-[var(--color-text-muted)]",
      ghost:
        "bg-transparent text-[var(--color-text-body)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]",
      navy:
        "bg-[var(--color-brand-navy)] text-white hover:bg-[var(--color-brand-navy-light)] shadow-sm",
      danger:
        "bg-[var(--color-danger)] text-white hover:bg-red-700 shadow-sm",
    };

    const sizeStyles = {
      sm: "text-xs px-3.5 py-1.5 gap-1.5",
      md: "text-sm px-5 py-2.5 gap-2",
      lg: "text-base px-7 py-3.5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
