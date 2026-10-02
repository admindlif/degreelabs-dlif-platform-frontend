import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "canvas" | "elevated" | "active";
}

export function Card({
  className,
  variant = "surface",
  children,
  ...props
}: CardProps) {
  const baseStyles =
    "rounded-[24px] p-6 md:p-8 transition-all duration-200 relative";

  const variantStyles = {
    surface:
      "bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]",
    canvas:
      "bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)]",
    elevated:
      "bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)] shadow-[0_4px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_36px_rgba(0,0,0,0.09)] hover:border-[var(--color-border-strong)]",
    active:
      "bg-[var(--color-bg-canvas)] border-2 border-[var(--color-brand-blue)] shadow-[0_4px_24px_rgba(56,119,249,0.08)]",
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-sm md:text-base text-[var(--color-text-body)] leading-relaxed",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-2", className)} {...props}>{children}</div>;
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center pt-6 gap-3", className)} {...props}>
      {children}
    </div>
  );
}
