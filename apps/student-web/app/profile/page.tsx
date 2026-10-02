"use client";

import { PortalShell } from "@/components/layout/portal-shell";

export default function ProfilePage() {
    return (
        <PortalShell
            breadcrumbItems={["Profile"]}
        >
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold">
                        Profile
                    </h1>

                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Manage your Fellow profile and account settings.
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[var(--color-border-default)]">
                    <p className="text-sm text-[var(--color-text-muted)]">
                        Profile management will be available here.
                    </p>
                </div>
            </div>
        </PortalShell>
    );
}
