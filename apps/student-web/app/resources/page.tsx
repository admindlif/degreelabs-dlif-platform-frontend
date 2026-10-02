"use client";

import * as React from "react";
import {
    BookOpen,
    ExternalLink,
    FileText,
} from "lucide-react";

import { PortalShell } from "@/components/layout/portal-shell";
import { getFellowResources } from "@/lib/api/toolkit";
import { PhaseResource } from "@/lib/api/types";

export default function ResourcesPage() {
    const [resources, setResources] = React.useState<PhaseResource[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        getFellowResources()
            .then(setResources)
            .catch((err) => {
                setError(err?.message || "Unable to load resources.");
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <PortalShell
            breadcrumbItems={["Resources"]}
        >
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold">
                        Resources
                    </h1>

                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Fellowship handbooks, templates, guides and reference material.
                    </p>
                </div>

                {loading && (
                    <div className="text-sm text-[var(--color-text-muted)]">
                        Loading resources...
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                        {error}
                    </div>
                )}

                {!loading && resources.length === 0 && (
                    <div className="p-8 rounded-2xl border border-[var(--color-border-default)] text-center text-sm text-[var(--color-text-muted)]">
                        No resources have been added yet.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resources.map((resource) => (
                        <div
                            key={resource.id}
                            className="p-5 rounded-2xl bg-white border border-[var(--color-border-default)]"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-blue-subtle)] flex items-center justify-center">
                                    {resource.resource_type === "handbook" ? (
                                        <BookOpen className="w-5 h-5 text-[var(--color-brand-blue)]" />
                                    ) : (
                                        <FileText className="w-5 h-5 text-[var(--color-brand-blue)]" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h2 className="font-bold">
                                        {resource.title}
                                    </h2>

                                    {resource.subtitle && (
                                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                            {resource.subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {resource.url && (
                                <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[var(--color-brand-blue)]"
                                >
                                    Open Resource
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </PortalShell>
    );
}
