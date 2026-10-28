"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";

export default function SubmissionInsightsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const query = searchParams.toString();
    const target = query ? `/working-board-insights?${query}` : "/working-board-insights";
    router.replace(target);
  }, [router, searchParams]);

  return (
    <PortalShell breadcrumbItems={["Mentor Insights"]}>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-brand-orange)] mb-3" />
        <p className="text-sm font-semibold text-[var(--color-navy)]">
          Redirecting to Mentor Insights...
        </p>
      </div>
    </PortalShell>
  );
}
