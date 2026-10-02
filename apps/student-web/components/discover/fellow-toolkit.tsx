"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Award,
  Download,
  ArrowUpRight,
  FileText,
  Link2,
  AlertCircle,
} from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FellowTeam, PhaseResource } from "@/lib/api/types";
import { getFellowTeam, getFellowResources } from "@/lib/api/toolkit";

// ── Icon map by resource_type ──────────────────────────────────────────────
function ResourceIcon({ type }: { type: string }) {
  const base = "w-4 h-4";
  switch (type) {
    case "handbook":
      return <BookOpen className={base} />;
    case "rubric":
      return <Award className={base} />;
    case "template":
      return <FileText className={base} />;
    default:
      return <Link2 className={base} />;
  }
}

function resourceAccentColor(type: string) {
  switch (type) {
    case "handbook":
      return {
        bg: "var(--color-brand-blue-subtle)",
        text: "var(--color-brand-blue)",
        hover: "hover:border-[var(--color-brand-blue)]",
        actionIcon: <Download className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-blue)]" />,
      };
    case "rubric":
    default:
      return {
        bg: "var(--color-brand-orange-subtle)",
        text: "var(--color-brand-orange)",
        hover: "hover:border-[var(--color-brand-orange)]",
        actionIcon: <ArrowUpRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-orange)]" />,
      };
  }
}

export function FellowToolkit() {
  const [team, setTeam] = React.useState<FellowTeam | null>(null);
  const [resources, setResources] = React.useState<PhaseResource[]>([]);
  const [teamLoading, setTeamLoading] = React.useState(true);
  const [resourcesLoading, setResourcesLoading] = React.useState(true);

  React.useEffect(() => {
    getFellowResources()
      .then((data) => setResources(data ?? []))
      .catch(() => setResources([]))
      .finally(() => setResourcesLoading(false));

    getFellowTeam()
      .then(setTeam)
      .catch(() => setTeam(null))
      .finally(() => setTeamLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Resources Toolkit Card ─────────────────────────────────────── */}
      <Card variant="surface">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-xl font-bold">Fellow Toolkit</CardTitle>
          <Badge variant="brand" size="sm">
            DISCOVER (THINK) Phase
          </Badge>
        </div>
        <CardDescription className="text-xs text-[var(--color-text-body)] mb-4">
          Resources
        </CardDescription>

        <div className="space-y-2.5">
          {resourcesLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-white border border-[var(--color-border-default)] animate-pulse h-14"
                />
              ))}
            </div>
          ) : resources.length > 0 ? (
            resources.map((resource) => {
              const accent = resourceAccentColor(resource.resource_type);
              const resourceContent = (
                <>
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: accent.bg, color: accent.text }}
                    >
                      <ResourceIcon type={resource.resource_type} />
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-xs font-bold text-[var(--color-text-primary)] transition-colors">
                        {resource.title}
                      </p>
                      {resource.subtitle && (
                        <p className="text-[10px] text-[var(--color-text-muted)]">
                          {resource.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  {resource.url && accent.actionIcon}
                </>
              );

              return resource.url ? (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3.5 rounded-xl bg-white border border-[var(--color-border-default)] ${accent.hover} hover:shadow-xs transition-all flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between group cursor-pointer`}
                >
                  {resourceContent}
                </a>
              ) : (
                <div
                  key={resource.id}
                  aria-disabled="true"
                  className="p-3.5 rounded-xl bg-white border border-[var(--color-border-default)] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between cursor-default"
                >
                  {resourceContent}
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-[var(--color-border-default)] bg-white p-4 text-sm text-[var(--color-text-muted)]">
              No resources yet.
            </div>
          )}
        </div>
      </Card>

      {/* ── Team Card ─────────────────────────────────────────────────── */}
      <Card variant="canvas" className="border-[var(--color-border-default)]">
        {teamLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-[var(--color-bg-subtle)] rounded w-1/2" />
            <div className="h-3 bg-[var(--color-bg-subtle)] rounded w-3/4" />
            <div className="flex gap-2 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-[var(--color-bg-subtle)]" />
              ))}
            </div>
          </div>
        ) : team ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--color-brand-navy)] text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="break-words text-base font-bold">
                    Team {team.name}
                  </CardTitle>
                  {team.company_challenge && (
                    <p className="break-words text-[10px] text-[var(--color-text-muted)]">
                      Company challenge: {team.company_challenge}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="success" size="sm">
                {team.member_count} {team.member_count === 1 ? "Fellow" : "Fellows"}
              </Badge>
            </div>

            {/* Member Avatars */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-default)]">
              <div className="flex -space-x-2">
                {team.members.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="w-7 h-7 rounded-full bg-[var(--color-bg-subtle)] border-2 border-white text-[10px] font-bold text-[var(--color-text-secondary)] flex items-center justify-center shadow-xs"
                    title={`${member.first_name} ${member.last_name}${member.team_role === "lead" ? " (Lead)" : ""}`}
                  >
                    {member.initials}
                  </div>
                ))}
                {team.members.length > 5 && (
                  <div className="w-7 h-7 rounded-full bg-[var(--color-brand-blue-subtle)] border-2 border-white text-[10px] font-bold text-[var(--color-brand-blue)] flex items-center justify-center shadow-xs">
                    +{team.members.length - 5}
                  </div>
                )}
              </div>

              <Link
                href="/team"
                className="inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-bold text-[var(--color-brand-blue)] transition-colors hover:bg-[var(--color-bg-subtle)]"
              >
                View Team Space →
              </Link>
            </div>
          </>
        ) : (
          /* No team assigned yet */
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Team assignment pending. Check back soon.</span>
          </div>
        )}
      </Card>
    </div>
  );
}
