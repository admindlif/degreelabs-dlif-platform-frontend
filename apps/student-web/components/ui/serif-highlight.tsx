import * as React from "react";
import { cn } from "@/lib/utils";

export interface SerifHighlightProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function SerifHighlight({
  className,
  children,
  ...props
}: SerifHighlightProps) {
  return (
    <span
      className={cn(
        "font-['DM_Serif_Text'] italic font-normal text-[var(--color-brand-orange)] tracking-[-0.018em]",
        className
      )}
      style={{ fontFamily: 'var(--font-serif-accent), "DM Serif Text", Georgia, serif' }}
      {...props}
    >
      {children}
    </span>
  );
}
