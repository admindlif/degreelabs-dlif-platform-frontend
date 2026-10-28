"use client";

import * as React from "react";
import { X, Loader2, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChecklistItem } from "@/lib/api/types";
import { submitChecklistResponse } from "@/lib/api/checklist";

interface ChecklistResponseModalProps {
  item: ChecklistItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedItem: ChecklistItem) => void;
  onOpenFeedback?: (item: ChecklistItem) => void;
}

export function ChecklistResponseModal({
  item,
  isOpen,
  onClose,
  onSuccess,
  onOpenFeedback,
}: ChecklistResponseModalProps) {
  const [contribution, setContribution] = React.useState("");
  const [reflection, setReflection] = React.useState("");
  const [myThoughts, setMyThoughts] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync state when opened with an item
  React.useEffect(() => {
    if (item && isOpen) {
      setContribution(item.contribution || "");
      setReflection(item.reflection || "");
      setMyThoughts(item.my_thoughts || "");
      setError(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;

    if (!contribution.trim()) {
      setError("Please describe your contribution.");
      return;
    }

    if (!reflection.trim()) {
      setError("Please share your reflection.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await submitChecklistResponse(
        item.id,
        contribution.trim(),
        reflection.trim(),
        myThoughts.trim()
      );
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to save your response. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const reviewStatus = (item.review_status || "not_checked").toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checklist-response-modal-title"
    >
      <div className="relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-6 py-4 bg-gradient-to-r from-orange-50/60 to-white">
          <div className="min-w-0 pr-4">
            <h2
              id="checklist-response-modal-title"
              className="text-base font-bold text-[var(--color-text-primary)]"
            >
              Checklist Response
            </h2>
            <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
              {item.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 leading-relaxed"
            >
              {error}
            </div>
          )}

          {/* Current Review Status Notice */}
          {reviewStatus !== "not_checked" && (
            <div className="flex items-center justify-between rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-3.5 py-2.5 text-xs">
              <span className="text-[var(--color-text-muted)]">Review Status:</span>
              <span
                className={`font-bold capitalize ${reviewStatus === "accepted"
                    ? "text-emerald-700"
                    : reviewStatus === "rejected"
                      ? "text-red-700"
                      : "text-amber-700"
                  }`}
              >
                {reviewStatus === "pending_review" ? "Pending Review" : reviewStatus}
              </span>
            </div>
          )}

          {/* Rejection Reason banner if rejected */}
          {reviewStatus === "rejected" && item.rejection_reason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 space-y-1">
              <div className="font-bold uppercase tracking-wider text-[10px] text-red-600">
                Mentor Rejection Reason
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{item.rejection_reason}</p>
            </div>
          )}

          {/* Field 1: My Contribution */}
          <div className="space-y-1.5">
            <label
              htmlFor="checklist-contribution"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]"
            >
              My Contribution
            </label>
            <p className="text-xs text-[var(--color-text-muted)]">
              Describe your contribution to this checklist item.
            </p>
            <textarea
              id="checklist-contribution"
              rows={4}
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              placeholder="Detail the research, calculations, synthesis, or artifacts you personally produced for this milestone..."
              disabled={saving}
              className="w-full resize-y rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--color-text-primary)] focus:border-[var(--color-brand-orange)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-orange)] transition-colors placeholder:text-[var(--color-text-muted)] disabled:opacity-60"
            />
          </div>

          {/* Field 2: Reflection */}
          <div className="space-y-1.5">
            <label
              htmlFor="checklist-reflection"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]"
            >
              My Reflection
            </label>
            <p className="text-xs text-[var(--color-text-muted)]">
              Share what you learned, identified, or need to improve.
            </p>
            <textarea
              id="checklist-reflection"
              rows={4}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Reflect on key takeaways, customer surprises, technical bottlenecks, or areas requiring next-round revision..."
              disabled={saving}
              className="w-full resize-y rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--color-text-primary)] focus:border-[var(--color-brand-orange)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-orange)] transition-colors placeholder:text-[var(--color-text-muted)] disabled:opacity-60"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="checklist-my-thoughts"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]"
            >
              My Thoughts
            </label>
            <p className="text-xs text-[var(--color-text-muted)]">
              Share any additional ideas, questions, or thoughts. (Optional)
            </p>
            <textarea
              id="checklist-my-thoughts"
              rows={4}
              maxLength={10000}
              value={myThoughts}
              onChange={(e) => setMyThoughts(e.target.value)}
              placeholder="Add your thoughts about this checklist item..."
              disabled={saving}
              className="w-full resize-y rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--color-text-primary)] focus:border-[var(--color-brand-orange)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-orange)] transition-colors placeholder:text-[var(--color-text-muted)] disabled:opacity-60"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[var(--color-border-default)]">
            {onOpenFeedback ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFeedback(item);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-orange)] hover:underline self-start sm:self-auto"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Discuss in Checklist Feedback</span>
              </button>
            ) : <span />}

            <div className="flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-[var(--color-brand-orange)] hover:bg-[#e05423] text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Response"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
