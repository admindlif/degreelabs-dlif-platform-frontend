"use client";

import { PortalShell } from "@/components/layout/portal-shell";

export default function AssignmentsPage() {
    return (
        <PortalShell
            breadcrumbItems={["Weekly Outputs"]}
        >
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold">
                        Weekly Outputs
                    </h1>

                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Submit and track your weekly fellowship outputs.
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[var(--color-border-default)]">
                    <p className="text-sm text-[var(--color-text-muted)]">
                        Weekly output submission will be connected here.
                    </p>
                </div>
            </div>
        </PortalShell>
    );
}
