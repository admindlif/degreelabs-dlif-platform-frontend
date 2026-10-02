"use client";

import * as React from "react";

import {
  AdminCohort,
  AdminTeam,
  createTeam,
  updateTeam,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/client";

interface TeamModalProps {
  team?: AdminTeam | null;
  cohorts: AdminCohort[];

  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export function TeamModal({
  team,
  cohorts,
  onClose,
  onSaved,
}: TeamModalProps) {
  const isEdit = Boolean(team);

  const [cohortId, setCohortId] =
    React.useState(
      team?.cohort_id ??
      cohorts[0]?.id ??
      ""
    );

  const [name, setName] =
    React.useState(
      team?.name ?? ""
    );

  const [companyName, setCompanyName] =
    React.useState(
      team?.company_name ?? ""
    );

  const [companyOverview, setCompanyOverview] =
    React.useState(
      team?.company_overview ?? ""
    );

  const [
    companyChallenge,
    setCompanyChallenge,
  ] = React.useState(
    team?.company_challenge ?? ""
  );

  const [
    challengeDescription,
    setChallengeDescription,
  ] = React.useState(
    team?.challenge_description ?? ""
  );

  const [isActive, setIsActive] =
    React.useState(
      team?.is_active ?? true
    );

  const [saving, setSaving] =
    React.useState(false);

  const [error, setError] =
    React.useState<string | null>(null);

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Team name is required.");
      return;
    }

    if (!cohortId) {
      setError("Please select a Cohort.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEdit && team) {
        await updateTeam(
          team.id,
          {
            name: name.trim(),

            company_name:
              companyName.trim() ||
              undefined,

            company_overview: companyOverview.trim() ||
              undefined,

            company_challenge:
              companyChallenge.trim() ||
              undefined,

            challenge_description: challengeDescription.trim() ||
              undefined,

            is_active: isActive,
          }
        );
      } else {
        await createTeam({
          cohort_id: cohortId,

          name: name.trim(),

          company_name:
            companyName.trim() ||
            undefined,

          company_overview:
            companyOverview.trim() ||
            undefined,

          company_challenge:
            companyChallenge.trim() ||
            undefined,

          challenge_description:
            challengeDescription.trim() ||
            undefined,

          is_active: isActive,
        });
      }

      await onSaved();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to save Team."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">

      <form
        onSubmit={handleSubmit}
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 shadow-2xl sm:max-h-[90vh] sm:p-6"
      >

        <div className="flex items-start justify-between mb-6">

          <div>
            <h3 className="text-lg font-extrabold">
              {isEdit
                ? "Edit Team"
                : "Create Team"}
            </h3>

            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Create a Fellow Team and assign it to a Cohort.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Team modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]"
          >
            ×
          </button>

        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">

          <div>
            <label className="block text-xs font-bold mb-1">
              Cohort *
            </label>

            <select
              required
              disabled={isEdit}
              value={cohortId}
              onChange={(event) =>
                setCohortId(
                  event.target.value
                )
              }
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)]"
            >
              <option value="">
                Select Cohort
              </option>

              {cohorts.map(
                (cohort) => (
                  <option
                    key={cohort.id}
                    value={cohort.id}
                  >
                    {cohort.name}
                  </option>
                )
              )}
            </select>
          </div>


          <div>
            <label className="block text-xs font-bold mb-1">
              Team Name *
            </label>

            <input
              required
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Team name"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)]"
            />
          </div>


          {/* Company Name */}
          <div>
            <label className="block text-xs font-bold mb-1">
              Company Name
            </label>

            <input
              value={companyName}
              onChange={(event) =>
                setCompanyName(
                  event.target.value
                )
              }
              placeholder="Company name"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)]"
            />
          </div>


          {/* Company Overview */}
          <div>
            <label className="block text-xs font-bold mb-1">
              Company Overview
            </label>

            <textarea
              rows={4}
              value={companyOverview}
              onChange={(event) =>
                setCompanyOverview(
                  event.target.value
                )
              }
              placeholder="Brief overview of the company"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)]"
            />
          </div>


          {/* Challenge Title */}
          <div>
            <label className="block text-xs font-bold mb-1">
              Challenge Title
            </label>

            <input
              value={companyChallenge}
              onChange={(event) =>
                setCompanyChallenge(
                  event.target.value
                )
              }
              placeholder="Challenge title"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)]"
            />
          </div>


          {/* Challenge Description */}
          <div>
            <label className="block text-xs font-bold mb-1">
              Challenge Description
            </label>

            <textarea
              rows={5}
              value={challengeDescription}
              onChange={(event) =>
                setChallengeDescription(
                  event.target.value
                )
              }
              placeholder="Describe the Company Challenge"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)]"
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-[var(--color-border-default)] p-4 cursor-pointer">

            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) =>
                setIsActive(
                  event.target.checked
                )
              }
              className="h-4 w-4"
            />

            <div>
              <div className="text-sm font-bold">
                Active Team
              </div>

              <div className="text-xs text-[var(--color-text-muted)]">
                Fellows can be assigned to this Team.
              </div>
            </div>

          </label>

        </div>


        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[var(--color-border-default)] pt-4 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-xl border border-[var(--color-border-default)] px-4 py-2 text-xs font-bold"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving ||
              !cohortId ||
              !name.trim()
            }
            className="min-h-10 rounded-xl bg-[var(--color-brand-blue)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Create Team"}
          </button>

        </div>

      </form>
    </div>
  );
}
