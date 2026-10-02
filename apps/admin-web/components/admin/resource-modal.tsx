"use client";

import * as React from "react";

import {
  AdminCohort,
  AdminPhase,
  AdminResource,
  AdminSession,
  createResource,
  updateResource,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/client";


interface ResourceModalProps {
  resource?: AdminResource | null;

  phases: AdminPhase[];
  sessions: AdminSession[];
  cohorts: AdminCohort[];

  onClose: () => void;
  onSaved: () => Promise<void> | void;
}


export function ResourceModal({
  resource,
  phases,
  sessions,
  cohorts,
  onClose,
  onSaved,
}: ResourceModalProps) {
  const isEdit = Boolean(resource);

  const [phaseId, setPhaseId] = React.useState(
    resource?.phase_id ??
    phases.find((phase) => phase.code === "DISCOVER")?.id ??
    phases[0]?.id ??
    ""
  );

  const [sessionId, setSessionId] = React.useState(
    resource?.session_id ?? ""
  );

  const [title, setTitle] = React.useState(
    resource?.title ?? ""
  );

  const [subtitle, setSubtitle] = React.useState(
    resource?.subtitle ?? ""
  );

  const [resourceType, setResourceType] = React.useState(
    resource?.resource_type ?? "link"
  );

  const [url, setUrl] = React.useState(
    resource?.url ?? ""
  );

  const [isDownloadable, setIsDownloadable] =
    React.useState(
      resource?.is_downloadable ?? false
    );

  const [isActive, setIsActive] =
    React.useState(
      resource?.is_active ?? true
    );

  const [sequence, setSequence] =
    React.useState(
      resource?.sequence ?? 0
    );

  const [saving, setSaving] =
    React.useState(false);

  const [error, setError] =
    React.useState<string | null>(null);


  const filteredSessions = sessions
    .filter(
      (session) =>
        session.phase_id === phaseId
    )
    .sort(
      (a, b) =>
        a.session_number -
        b.session_number
    );


  function getCohortName(
    cohortId: string
  ) {
    return (
      cohorts.find(
        (cohort) =>
          cohort.id === cohortId
      )?.name ?? "Unknown Cohort"
    );
  }


  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setSaving(true);
    setError(null);

    try {
      if (!phaseId) {
        throw new Error(
          "Please select a Phase."
        );
      }

      if (!title.trim()) {
        throw new Error(
          "Please enter a Resource title."
        );
      }

      if (isEdit && resource) {
        await updateResource(
          resource.id,
          {
            session_id:
              sessionId || null,

            title:
              title.trim(),

            subtitle:
              subtitle.trim() ||
              undefined,

            resource_type:
              resourceType,

            url:
              url.trim() ||
              undefined,

            is_downloadable:
              isDownloadable,

            is_active:
              isActive,

            sequence:
              Number(sequence),
          }
        );
      } else {
        await createResource({
          phase_id:
            phaseId,

          session_id:
            sessionId || null,

          title:
            title.trim(),

          subtitle:
            subtitle.trim() ||
            undefined,

          resource_type:
            resourceType,

          url:
            url.trim() ||
            undefined,

          is_downloadable:
            isDownloadable,

          is_active:
            isActive,

          sequence:
            Number(sequence),
        });
      }

      await onSaved();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to save Resource."));
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 shadow-2xl sm:max-h-[90vh] sm:p-6"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-extrabold">
              {isEdit
                ? "Edit Resource"
                : "Add Resource"}
            </h3>

            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Add a phase-level toolkit item or
              attach a Resource to a specific Session.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Resource modal"
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
              Phase *
            </label>

            <select
              required
              disabled={isEdit}
              value={phaseId}
              onChange={(event) => {
                setPhaseId(
                  event.target.value
                );

                setSessionId("");
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
            >
              <option value="">
                Select Phase
              </option>

              {phases.map(
                (phase) => (
                  <option
                    key={phase.id}
                    value={phase.id}
                  >
                    {phase.name} ({phase.code})
                  </option>
                )
              )}
            </select>
          </div>


          <div>
            <label className="block text-xs font-bold mb-1">
              Resource Scope
            </label>

            <select
              value={sessionId}
              onChange={(event) =>
                setSessionId(
                  event.target.value
                )
              }
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
            >
              <option value="">
                Phase Toolkit — visible outside Sessions
              </option>

              {filteredSessions.map(
                (session) => (
                  <option
                    key={session.id}
                    value={session.id}
                  >
                    {getCohortName(
                      session.cohort_id
                    )}
                    {" — "}
                    Session{" "}
                    {session.session_number}
                    {" — "}
                    {session.title}
                  </option>
                )
              )}
            </select>

            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Select a Session to show this Resource
              only inside that Session&apos;s Resources tab.
            </p>
          </div>


          <div>
            <label className="block text-xs font-bold mb-1">
              Resource Title *
            </label>

            <input
              required
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="Resource title"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
            />
          </div>


          <div>
            <label className="block text-xs font-bold mb-1">
              Subtitle
            </label>

            <input
              value={subtitle}
              onChange={(event) =>
                setSubtitle(
                  event.target.value
                )
              }
              placeholder="Resource subtitle"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
            />
          </div>


          <div>
            <label className="block text-xs font-bold mb-1">
              Resource Type
            </label>

            <select
              value={resourceType}
              onChange={(event) =>
                setResourceType(
                  event.target.value
                )
              }
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
            >
              <option value="link">
                Link
              </option>

              <option value="handbook">
                Handbook
              </option>

              <option value="template">
                Template
              </option>

              <option value="guide">
                Guide
              </option>

              <option value="rubric">
                Rubric
              </option>
            </select>
          </div>


          <div>
            <label className="block text-xs font-bold mb-1">
              Resource URL
            </label>

            <input
              type="url"
              value={url}
              onChange={(event) =>
                setUrl(
                  event.target.value
                )
              }
              placeholder="https://drive.google.com/..."
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
            />
          </div>


          <div>
            <label className="block text-xs font-bold mb-1">
              Sequence
            </label>

            <input
              type="number"
              min={0}
              value={sequence}
              onChange={(event) =>
                setSequence(
                  Number(
                    event.target.value
                  )
                )
              }
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] text-sm"
            />
          </div>


          <div className="flex flex-col sm:flex-row gap-4">

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={
                  isDownloadable
                }
                onChange={(event) =>
                  setIsDownloadable(
                    event.target.checked
                  )
                }
              />

              Downloadable
            </label>


            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) =>
                  setIsActive(
                    event.target.checked
                  )
                }
              />

              Active
            </label>

          </div>

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
              !phaseId ||
              !title.trim()
            }
            className="min-h-10 rounded-xl bg-[var(--color-brand-blue)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Add Resource"}
          </button>

        </div>
      </form>
    </div>
  );
}
