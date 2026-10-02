import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "brand" | "blue" | "navy" | "success" | "muted" | "gold" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "brand",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-bold tracking-tight rounded-full uppercase select-none transition-colors";

  const variantStyles = {
    brand:
      "bg-[var(--color-brand-orange-subtle)] text-[var(--color-brand-orange)] border border-[#FFD5C6]",
    blue:
      "bg-[var(--color-brand-blue-subtle)] text-[var(--color-brand-blue)] border border-[#D5E5FE]",
    navy:
      "bg-[var(--color-brand-navy)] text-white",
    success:
      "bg-[#E8FAF0] text-[#128C48] border border-[#BCEFD3]",
    muted:
      "bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border-default)]",
    gold:
      "bg-[#FFFBE6] text-[#A67800] border border-[#FFE885]",
    outline:
      "bg-transparent text-[var(--color-text-secondary)] border border-[var(--color-border-strong)]",
  };

  const sizeStyles = {
    sm: "text-[10px] px-2.5 py-0.5 tracking-wider gap-1",
    md: "text-xs px-3 py-1 tracking-wide gap-1.5",
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}
