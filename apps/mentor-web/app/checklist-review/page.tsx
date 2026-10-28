"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  Search,
  User,
  MessageSquare,
  X,
  Check,
  Plus,
  Pencil,
  Power,
} from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getMentorChecklistDefinitions,
  getMentorTeams,
  getTeamChecklist,
  reviewChecklistItem,
  setMentorChecklistDefinitionActive,
} from "@/lib/api/mentor";
import type {
  MentorChecklistDefinition,
  MentorTeamSummary,
  MentorChecklistItem,
} from "@/lib/api/types";
import { MentorChecklistItemModal } from "@/components/checklist/mentor-checklist-item-modal";

type FilterStatus = "all" | "pending_review" | "accepted" | "rejected" | "not_checked";

function ReviewStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "accepted")
    return (
      <Badge variant="success" size="sm" className="gap-1">
        <CheckCircle2 className="h-3 w-3" /> Accepted
      </Badge>
    );
  if (s === "rejected")
    return (
      <Badge variant="danger" size="sm" className="gap-1">
        <XCircle className="h-3 w-3" /> Rejected
      </Badge>
    );
  if (s === "pending_review")
    return (
      <Badge variant="warning" size="sm" className="gap-1">
        <Clock className="h-3 w-3" /> Pending Review
      </Badge>
    );
  return <Badge variant="muted" size="sm">Not Checked</Badge>;
}

interface ReviewModalProps {
  item: MentorChecklistItem;
  onClose: () => void;
  onSuccess: (updated: MentorChecklistItem) => void;
}

function ReviewModal({ item, onClose, onSuccess }: ReviewModalProps) {
  const [decision, setDecision] = React.useState<"accepted" | "rejected" | null>(null);
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!decision) {
      setError("Please select Accept or Reject.");
      return;
    }
    if (decision === "rejected" && !reason.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await reviewChecklistItem(item.team_id, item.checklist_item_id, item.fellow_id, {
        action: decision === "accepted" ? "accept" : "reject",
        rejection_reason: decision === "rejected" ? reason.trim() : undefined,
      });
      onSuccess({
        ...item,
        review_status: decision,
        rejection_reason: decision === "rejected" ? reason.trim() : null,
        reviewed_at: new Date().toISOString(),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save review.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--color-border-default)] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-6 py-4 bg-gradient-to-r from-orange-50/60 to-white">
          <div>
            <h2 id="review-modal-title" className="text-sm font-bold text-[var(--color-text-primary)]">
              Review Checklist Item
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 max-w-sm truncate">{item.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Fellow Response */}
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              <User className="h-3.5 w-3.5" />
              Fellow: {item.fellow_name}
            </div>
            {item.contribution && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                  Contribution
                </span>
                <p className="text-xs text-[var(--color-text-body)] leading-relaxed whitespace-pre-wrap">
                  {item.contribution}
                </p>
              </div>
            )}
            {item.reflection && (
              <div className="space-y-1 pt-2 border-t border-[var(--color-border-default)]">
                <span className="text-[11px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                  Reflection
                </span>
                <p className="text-xs text-[var(--color-text-body)] leading-relaxed whitespace-pre-wrap">
                  {item.reflection}
                </p>
              </div>
            )}
            {item.my_thoughts && (
              <div className="space-y-1 pt-2 border-t border-[var(--color-border-default)]">
                <span className="text-[11px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                  My Thoughts
                </span>
                <p className="text-xs text-[var(--color-text-body)] leading-relaxed whitespace-pre-wrap">
                  {item.my_thoughts}
                </p>
              </div>
            )}
            {!item.contribution && !item.reflection && !item.my_thoughts && (
              <p className="text-xs text-[var(--color-text-muted)] italic">
                Fellow has not submitted a response yet.
              </p>
            )}
          </div>

          {/* Decision Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
              Your Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision("accepted")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                  decision === "accepted"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:border-emerald-300 hover:text-emerald-600"
                }`}
              >
                <Check className="h-4 w-4" />
                Accept
              </button>
              <button
                type="button"
                onClick={() => setDecision("rejected")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                  decision === "rejected"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:border-red-300 hover:text-red-600"
                }`}
              >
                <X className="h-4 w-4" />
                Reject
              </button>
            </div>
          </div>

          {/* Rejection Reason */}
          {decision === "rejected" && (
            <div className="space-y-1.5">
              <label
                htmlFor="rejection-reason"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]"
              >
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-[var(--color-text-muted)]">
                Be specific — this will be shown to the fellow so they know what to improve.
              </p>
              <textarea
                id="rejection-reason"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain what is missing or needs to be improved..."
                disabled={saving}
                className="w-full resize-y rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--color-text-primary)] focus:border-[var(--color-brand-orange)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-orange)] disabled:opacity-60"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--color-border-default)]">
            <Link
              href={`/checklist-feedback?teamId=${item.team_id}&itemId=${item.checklist_item_id}&fellowId=${item.fellow_id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-orange)] hover:underline"
              onClick={onClose}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Open Discussion Thread
            </Link>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving || !decision}
                className={`text-white ${
                  decision === "rejected"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : decision === "rejected" ? (
                  "Reject"
                ) : (
                  "Accept"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChecklistReviewContent() {
  const searchParams = useSearchParams();
  const initialTeamId = searchParams.get("teamId") ?? "";

  const [teams, setTeams] = React.useState<MentorTeamSummary[]>([]);
  const [selectedTeamId, setSelectedTeamId] = React.useState(initialTeamId);
  const [items, setItems] = React.useState<MentorChecklistItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingItems, setLoadingItems] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<FilterStatus>("pending_review");
  const [search, setSearch] = React.useState("");
  const [reviewItem, setReviewItem] = React.useState<MentorChecklistItem | null>(null);
  const [definitions, setDefinitions] = React.useState<MentorChecklistDefinition[]>([]);
  const [loadingDefinitions, setLoadingDefinitions] = React.useState(false);
  const [definitionItem, setDefinitionItem] = React.useState<MentorChecklistDefinition | null>(null);
  const [definitionModalOpen, setDefinitionModalOpen] = React.useState(false);

  // Load teams
  React.useEffect(() => {
    getMentorTeams()
      .then((t) => {
        setTeams(t);
        if (!selectedTeamId && t.length > 0) {
          setSelectedTeamId(t[0].id);
        }
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Unable to load teams.")
      )
      .finally(() => setLoading(false));
  }, []);

  // Load checklist items for selected team
  React.useEffect(() => {
    if (!selectedTeamId) return;
    setLoadingItems(true);
    setError(null);
    getTeamChecklist(selectedTeamId)
      .then(setItems)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Unable to load checklist.")
      )
      .finally(() => setLoadingItems(false));
  }, [selectedTeamId]);

  const loadDefinitions = React.useCallback(async () => {
    if (!selectedTeamId) return;
    setLoadingDefinitions(true);
    try {
      setDefinitions(await getMentorChecklistDefinitions(selectedTeamId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load checklist definitions.");
    } finally {
      setLoadingDefinitions(false);
    }
  }, [selectedTeamId]);

  React.useEffect(() => {
    void loadDefinitions();
  }, [loadDefinitions]);

  const filteredItems = React.useMemo(() => {
    let result = items;
    if (filter !== "all") {
      result = result.filter((i) => i.review_status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.fellow_name.toLowerCase().includes(q) ||
          (i.session_name ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, filter, search]);

  const pendingCount = items.filter((i) => i.review_status === "pending_review").length;
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  function handleReviewSuccess(updated: MentorChecklistItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  async function handleActivation(item: MentorChecklistDefinition) {
    try {
      const updated = await setMentorChecklistDefinitionActive(item.id, !item.is_active);
      setDefinitions((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
      setItems(await getTeamChecklist(selectedTeamId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to update checklist item.");
    }
  }

  const filterLabels: Record<FilterStatus, string> = {
    all: "All Items",
    pending_review: `Pending Review${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
    accepted: "Accepted",
    rejected: "Rejected",
    not_checked: "Not Checked",
  };

  return (
    <PortalShell breadcrumbItems={["Checklist Review"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">
              Checklist Review
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Review Fellow responses and manage checklist items for your assigned teams.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={teams.length === 0}
            onClick={() => {
              setDefinitionItem(null);
              setDefinitionModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create Checklist Item
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Team Selector */}
        {!loading && teams.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-[var(--color-text-muted)]">Team:</span>
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTeamId(t.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  t.id === selectedTeamId
                    ? "bg-[var(--color-brand-orange)] text-white shadow-xs"
                    : "border border-[var(--color-border-default)] bg-white text-[var(--color-text-body)] hover:border-orange-200"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        {selectedTeamId && (
          <section className="rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Checklist Definitions</h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  Admin definitions are read-only. You can edit or deactivate items you created.
                </p>
              </div>
              {loadingDefinitions && <Loader2 className="h-4 w-4 animate-spin text-[var(--color-text-muted)]" />}
            </div>
            {!loadingDefinitions && definitions.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">No checklist definitions apply to this team.</p>
            ) : (
              <div className="divide-y divide-[var(--color-border-default)]">
                {definitions.map((definition) => (
                  <div key={`${definition.applicable_team_id}:${definition.id}`} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{definition.title}</p>
                        <Badge variant={definition.is_active ? "success" : "muted"} size="sm">
                          {definition.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="muted" size="sm">{definition.can_edit ? "Mentor-created" : "Admin"}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {definition.description || "No instructions provided."}
                      </p>
                    </div>
                    {definition.can_edit && (
                      <div className="flex shrink-0 gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => { setDefinitionItem(definition); setDefinitionModalOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button type="button" variant={definition.is_active ? "danger" : "secondary"} size="sm" onClick={() => void handleActivation(definition)}>
                          <Power className="h-3.5 w-3.5" /> {definition.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, fellow name, or session..."
              className="w-full rounded-xl border border-[var(--color-border-default)] bg-white pl-8 pr-3.5 py-2 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand-orange)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-orange)]"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(Object.keys(filterLabels) as FilterStatus[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                  filter === f
                    ? "bg-[var(--color-brand-navy)] text-white"
                    : "border border-[var(--color-border-default)] bg-white text-[var(--color-text-muted)] hover:border-gray-300"
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Items List */}
        {loadingItems ? (
          <div className="flex items-center gap-2 py-12 text-xs text-[var(--color-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading checklist items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-12 text-center">
            <ClipboardCheck className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {filter === "pending_review"
                ? "No items pending review"
                : "No items found"}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {filter === "pending_review"
                ? `${selectedTeam?.name ?? "This team"} has no submitted checklist items awaiting review.`
                : "Try adjusting your filters or search query."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[var(--color-border-default)] bg-white shadow-xs hover:shadow-sm transition-shadow"
              >
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                        {item.session_name && (
                          <span className="text-[var(--color-brand-orange)]">{item.session_name}</span>
                        )}
                        {item.week_number && <span>Week {item.week_number}</span>}
                        {item.category && <span>• {item.category}</span>}
                        {item.is_required && (
                          <span className="rounded-full bg-[var(--color-brand-orange-subtle)] px-2 py-0.5 text-[var(--color-brand-orange)]">
                            Required
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-snug">
                        {item.title}
                      </h3>
                    </div>
                    <ReviewStatusBadge status={item.review_status} />
                  </div>

                  {/* Fellow info */}
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-3">
                    <User className="h-3.5 w-3.5" />
                    <span>{item.fellow_name}</span>
                    <span>·</span>
                    <span>{item.team_name}</span>
                  </div>

                  {/* Response preview */}
                  {item.contribution && (
                    <div className="rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] px-3.5 py-2.5 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                        Contribution
                      </span>
                      <p className="text-xs text-[var(--color-text-body)] mt-1 leading-relaxed line-clamp-2">
                        {item.contribution}
                      </p>
                    </div>
                  )}

                  {/* Rejection reason */}
                  {item.review_status === "rejected" && item.rejection_reason && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                        Rejection Reason
                      </span>
                      <p className="text-xs text-red-800 mt-1 leading-relaxed">
                        {item.rejection_reason}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-3 border-t border-[var(--color-border-default)]">
                    {item.review_status === "pending_review" && (
                      <Button
                        size="sm"
                        onClick={() => setReviewItem(item)}
                        className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-hover)] text-white"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                        Review
                      </Button>
                    )}
                    {(item.review_status === "accepted" || item.review_status === "rejected") && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setReviewItem(item)}
                      >
                        Edit Decision
                      </Button>
                    )}
                    <Link
                      href={`/checklist-feedback?teamId=${item.team_id}&itemId=${item.checklist_item_id}&fellowId=${item.fellow_id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-brand-orange)] transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Discussion
                    </Link>
                    {item.due_at && (
                      <span className="ml-auto text-[11px] text-[var(--color-text-muted)]">
                        Due: {new Date(item.due_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MentorChecklistItemModal
        open={definitionModalOpen}
        teams={teams}
        initialTeamId={selectedTeamId}
        item={definitionItem}
        onClose={() => setDefinitionModalOpen(false)}
        onSaved={(saved) => {
          setDefinitions((current) => {
            const exists = current.some((entry) => entry.id === saved.id);
            return exists
              ? current.map((entry) => entry.id === saved.id ? saved : entry)
              : [...current, saved];
          });
          if (saved.applicable_team_id === selectedTeamId) {
            void getTeamChecklist(selectedTeamId).then(setItems);
          }
        }}
      />

      {reviewItem && (
        <ReviewModal
          item={reviewItem}
          onClose={() => setReviewItem(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </PortalShell>
  );
}

export default function ChecklistReviewPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-orange)]" />
        </div>
      }
    >
      <ChecklistReviewContent />
    </React.Suspense>
  );
}
