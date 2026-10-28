"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    ChevronDown,
    FileCheck,
    FolderOpen,
    MessageSquare,
    PlayCircle,
    RefreshCw,
    Video,
    AlertCircle,
    ExternalLink,
} from "lucide-react";

import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { SessionRecordingTab } from "@/components/recording/session-recording-tab";
import { SessionOverview } from "@/components/sessions/session-overview";
import { ApiError } from "@/lib/api/client";
import {
    getSessionDetail,
    getSessionResources,
    getSessionSubmission,
    saveSessionSubmission,
    getSessionFeedback,
    getFellowWorkingBoard,
    getFellowWorkingBoardInsights,
} from "@/lib/api/discover";
import {
    PhaseResource,
    SessionDetail,
    SessionSubmissionResponse,
    SubmissionFeedback,
    FellowWorkingBoardResponse,
    FellowWorkingBoardInsightsResponse,
} from "@/lib/api/types";

type Tab =
    | "overview"
    | "resources"
    | "recording"
    | "submission"
    | "feedback";

const VALID_TABS: readonly Tab[] = [
    "overview",
    "resources",
    "recording",
    "submission",
    "feedback",
];

function getRequestedTab(value: string | null): Tab {
    return VALID_TABS.includes(value as Tab)
        ? (value as Tab)
        : "overview";
}

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message
        ? error.message
        : fallback;
}

type SessionLoadError = "locked" | "not_found" | "generic";

function classifySessionLoadError(error: unknown): SessionLoadError {
    if (error instanceof ApiError) {
        if (error.status === 403) return "locked";
        if (error.status === 404) return "not_found";
    }
    return "generic";
}

function SessionWorkspaceContent() {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const sessionId = params.sessionId as string;

    const [session, setSession] =
        React.useState<SessionDetail | null>(null);
    const [currentTime] = React.useState(() => Date.now());

    const [resources, setResources] =
        React.useState<PhaseResource[]>([]);

    const [resourcesLoading, setResourcesLoading] =
        React.useState(false);

    const [resourcesError, setResourcesError] =
        React.useState<string | null>(null);

    const [resourcesLoaded, setResourcesLoaded] =
        React.useState(false);

    const [workingBoard, setWorkingBoard] =
        React.useState<FellowWorkingBoardResponse | null>(null);
    const [workingBoardLoading, setWorkingBoardLoading] =
        React.useState(false);
    const [workingBoardError, setWorkingBoardError] =
        React.useState<string | null>(null);
    const [workingBoardLoaded, setWorkingBoardLoaded] =
        React.useState(false);

    const [workingBoardInsights, setWorkingBoardInsights] =
        React.useState<FellowWorkingBoardInsightsResponse | null>(null);
    const [insightsLoading, setInsightsLoading] =
        React.useState(false);
    const [insightsError, setInsightsError] =
        React.useState<string | null>(null);
    const [insightsLoaded, setInsightsLoaded] =
        React.useState(false);

    const [submissionData, setSubmissionData] =
        React.useState<SessionSubmissionResponse | null>(null);

    const [submissionUrl, setSubmissionUrl] =
        React.useState("");

    const [submissionLoading, setSubmissionLoading] =
        React.useState(false);

    const [submissionSaving, setSubmissionSaving] =
        React.useState(false);

    const [submissionError, setSubmissionError] =
        React.useState<string | null>(null);

    const [submissionLoaded, setSubmissionLoaded] =
        React.useState(false);

    const activeTab = getRequestedTab(
        searchParams.get("tab")
    );

    const [loading, setLoading] =
        React.useState(true);

    const [error, setError] =
        React.useState<SessionLoadError | null>(null);

    const [feedback, setFeedback] =
        React.useState<SubmissionFeedback | null>(null);

    const [feedbackLoading, setFeedbackLoading] =
        React.useState(false);

    const [feedbackError, setFeedbackError] =
        React.useState<string | null>(null);

    const [feedbackLoaded, setFeedbackLoaded] =
        React.useState(false);

    // Mobile-only accordion: which section is open. Default = "overview".
    const [mobileOpenSection, setMobileOpenSection] =
        React.useState<Tab | null>(activeTab || "overview");

    const [refreshing, setRefreshing] = React.useState(false);
    const [lastRefreshedAt, setLastRefreshedAt] = React.useState<Date | null>(null);
    const [recordingRefreshKey, setRecordingRefreshKey] = React.useState(0);

    const loadSession = React.useCallback(
        async (silent = false) => {
            if (!silent) setLoading(true);
            try {
                const data = await getSessionDetail(sessionId);
                setSession(data);
                setError(null);
                return data;
            } catch (err: unknown) {
                setError(classifySessionLoadError(err));
                return null;
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [sessionId]
    );

    const loadResources = React.useCallback(
        async (silent = false) => {
            if (!sessionId) return;
            if (!silent) setResourcesLoading(true);
            setResourcesError(null);

            try {
                const data = await getSessionResources(sessionId);
                setResources(data);
                setResourcesLoaded(true);
            } catch (err: unknown) {
                setResourcesError(
                    getErrorMessage(err, "Unable to load Session resources.")
                );
            } finally {
                if (!silent) setResourcesLoading(false);
            }
        },
        [sessionId]
    );

    const loadWorkingBoard = React.useCallback(
        async (silent = false) => {
            if (!sessionId) return;
            if (!silent) setWorkingBoardLoading(true);
            setWorkingBoardError(null);

            try {
                const data = await getFellowWorkingBoard(sessionId);
                setWorkingBoard(data);
                setWorkingBoardLoaded(true);
            } catch (err: unknown) {
                setWorkingBoardError(
                    getErrorMessage(err, "Unable to load Team Working Board.")
                );
            } finally {
                if (!silent) setWorkingBoardLoading(false);
            }
        },
        [sessionId]
    );

    const loadWorkingBoardInsights = React.useCallback(
        async (silent = false) => {
            if (!sessionId) return;
            if (!silent) setInsightsLoading(true);
            setInsightsError(null);

            try {
                const data = await getFellowWorkingBoardInsights(sessionId);
                setWorkingBoardInsights(data);
                setInsightsLoaded(true);
            } catch (err: unknown) {
                setInsightsError(
                    getErrorMessage(err, "Unable to load Team Mentor Insights.")
                );
            } finally {
                if (!silent) setInsightsLoading(false);
            }
        },
        [sessionId]
    );

    const loadSubmission = React.useCallback(
        async (silent = false, enabled?: boolean) => {
            const isEnabled = enabled !== undefined ? enabled : session?.submission_enabled;
            if (!sessionId || !isEnabled) return;
            if (!silent) setSubmissionLoading(true);
            setSubmissionError(null);

            try {
                const data = await getSessionSubmission(sessionId);
                setSubmissionData(data);
                if (data.submission?.drive_url) {
                    setSubmissionUrl(data.submission.drive_url);
                }
                setSubmissionLoaded(true);
            } catch (err: unknown) {
                setSubmissionError(
                    getErrorMessage(err, "Unable to load Team submission.")
                );
            } finally {
                if (!silent) setSubmissionLoading(false);
            }
        },
        [sessionId, session?.submission_enabled]
    );

    const loadFeedback = React.useCallback(
        async (silent = false) => {
            if (!sessionId) return;
            if (!silent) setFeedbackLoading(true);
            setFeedbackError(null);

            try {
                const data = await getSessionFeedback(sessionId);
                setFeedback(data);
                setFeedbackLoaded(true);
            } catch (err: unknown) {
                setFeedbackError(
                    getErrorMessage(err, "Unable to load Team feedback.")
                );
            } finally {
                if (!silent) setFeedbackLoading(false);
            }
        },
        [sessionId]
    );

    const retrySession = React.useCallback(() => {
        setLoading(true);
        setError(null);
        void loadSession();
    }, [loadSession]);

    const handleRefresh = React.useCallback(async () => {
        if (refreshing || !sessionId) return;
        setRefreshing(true);

        try {
            await loadSession(true);

            const promises: Promise<unknown>[] = [];

            // Always refresh resources whenever refresh is requested
            promises.push(loadResources(true));

            if (activeTab === "submission" || mobileOpenSection === "submission" || workingBoardLoaded) {
                promises.push(loadWorkingBoard(true));
            }

            if (activeTab === "feedback" || mobileOpenSection === "feedback" || insightsLoaded) {
                promises.push(loadWorkingBoardInsights(true));
            }

            if (activeTab === "recording" || mobileOpenSection === "recording") {
                setRecordingRefreshKey((k) => k + 1);
            }

            if (promises.length > 0) {
                await Promise.allSettled(promises);
            }

            setLastRefreshedAt(new Date());
        } catch (err: unknown) {
            console.error("Failed to refresh session data:", err);
        } finally {
            setRefreshing(false);
        }
    }, [
        refreshing,
        sessionId,
        loadSession,
        activeTab,
        mobileOpenSection,
        workingBoardLoaded,
        insightsLoaded,
        loadResources,
        loadWorkingBoard,
        loadWorkingBoardInsights,
    ]);

    const selectTab = React.useCallback((tab: Tab) => {
        const nextSearchParams = new URLSearchParams(
            searchParams.toString()
        );

        if (tab === "overview") {
            nextSearchParams.delete("tab");
        } else {
            nextSearchParams.set("tab", tab);
        }

        const query = nextSearchParams.toString();
        router.replace(
            query ? `${pathname}?${query}` : pathname,
            { scroll: false }
        );
    }, [pathname, router, searchParams]);

    // Toggle mobile accordion section.
    // Pure local toggle: collapses if currently open, opens if closed.
    const toggleMobileSection = React.useCallback((tab: Tab) => {
        setMobileOpenSection((prev) => (prev === tab ? null : tab));
    }, []);

    React.useEffect(() => {
        if (!sessionId) return;

        let cancelled = false;

        void getSessionDetail(sessionId)
            .then((data) => {
                if (cancelled) return;
                setSession(data);
                setError(null);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setError(classifySessionLoadError(err));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    React.useEffect(() => {
        const isNeeded =
            activeTab === "resources" ||
            mobileOpenSection === "resources";

        if (!isNeeded || !sessionId) {
            return;
        }

        void loadResources(resourcesLoaded);
    }, [
        activeTab,
        mobileOpenSection,
        resourcesLoaded,
        sessionId,
        loadResources,
    ]);

    React.useEffect(() => {
        const isNeeded =
            activeTab === "submission" ||
            mobileOpenSection === "submission";

        if (!isNeeded || workingBoardLoaded || !sessionId) {
            return;
        }

        void loadWorkingBoard();
    }, [
        activeTab,
        mobileOpenSection,
        workingBoardLoaded,
        sessionId,
        loadWorkingBoard,
    ]);

    React.useEffect(() => {
        const isNeeded =
            activeTab === "feedback" ||
            mobileOpenSection === "feedback";

        if (!isNeeded || insightsLoaded || !sessionId) {
            return;
        }

        void loadWorkingBoardInsights();
    }, [
        activeTab,
        mobileOpenSection,
        insightsLoaded,
        sessionId,
        loadWorkingBoardInsights,
    ]);

    if (loading && !session) {
        return (
            <PortalShell breadcrumbItems={["Session"]}>
                <div className="rounded-2xl border border-[var(--color-border-default)] py-16 text-center text-sm text-[var(--color-text-muted)]">
                    Loading Session...
                </div>
            </PortalShell>
        );
    }



    if (error || !session) {
        const errorKind = error ?? "generic";
        const errorCopy = {
            locked: {
                title: "Session locked",
                message: "This Session is not available yet.",
            },
            not_found: {
                title: "Session not found",
                message: "The requested Session could not be found.",
            },
            generic: {
                title: "Unable to open Session",
                message: "Unable to load this Session. Please try again.",
            },
        }[errorKind];

        return (
            <PortalShell breadcrumbItems={["Session"]}>
                <div className="max-w-2xl mx-auto py-16">
                    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6">
                        <h1 className="font-bold text-red-800">
                            {errorCopy.title}
                        </h1>

                        <p className="text-sm text-red-700 mt-2">
                            {errorCopy.message}
                        </p>

                        <div className="flex flex-wrap gap-3 mt-5">
                            {errorKind === "generic" && (
                                <Button onClick={retrySession}>
                                    <RefreshCw className="w-4 h-4" />
                                    Retry
                                </Button>
                            )}

                            <Link
                                href="/sessions"
                                className="inline-flex items-center justify-center rounded-full border border-[var(--color-border-strong)] px-5 py-2.5 text-sm font-bold tracking-tight text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-subtle)]"
                            >
                                Back to Sessions
                            </Link>
                        </div>
                    </div>
                </div>
            </PortalShell>
        );
    }

    async function handleSubmissionSave() {
        const url = submissionUrl.trim();

        if (!url) {
            setSubmissionError(
                "Please enter the Google Drive submission link."
            );
            return;
        }

        setSubmissionSaving(true);
        setSubmissionError(null);

        try {
            const data = await saveSessionSubmission(
                sessionId,
                url
            );

            setSubmissionData(data);
            setSubmissionUrl(
                data.submission?.drive_url ?? ""
            );
        } catch (err: unknown) {
            setSubmissionError(
                getErrorMessage(err, "Unable to save Team submission.")
            );
        } finally {
            setSubmissionSaving(false);
        }
    }

    const tabs: {
        key: Tab;
        label: string;
        icon: React.ElementType;
    }[] = [
            {
                key: "overview",
                label: "Overview & Meeting",
                icon: Video,
            },
            {
                key: "resources",
                label: "Resources",
                icon: FolderOpen,
            },
            {
                key: "recording",
                label: "Recording & Transcript",
                icon: PlayCircle,
            },
            {
                key: "submission",
                label: "Working Board",
                icon: FileCheck,
            },
            {
                key: "feedback",
                label: "Mentor Insights",
                icon: MessageSquare,
            },
        ];

    const sessionHasEnded =
        session.status === "completed" ||
        (!!session.end_at &&
            new Date(session.end_at).getTime() < currentTime);

    // ── Shared content blocks (used by both desktop tabs and mobile accordion) ──

    const overviewContent = (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold">
                    Session Details
                </h2>

                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    Review the Session schedule and
                    join the live meeting.
                </p>
            </div>

            {sessionHasEnded ? (
                <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        Session completed
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        This session has already ended. You can no longer join this meeting.
                    </p>
                </div>
            ) : session.meeting_url ? (
                <a
                    href={session.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-orange)] px-5 py-3 text-sm font-bold text-white sm:w-auto"
                >
                    <Video className="w-4 h-4" />
                    Join Google Meet
                </a>
            ) : (
                <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5 text-sm text-[var(--color-text-muted)]">
                    Meeting link has not been published yet.
                </div>
            )}

            {/* Global Session Overview (Option B) */}
            <SessionOverview
                sessionId={session.id}
                weekNumber={session.week_number}
                sessionNumber={session.session_number}
                phaseCode="DISCOVER"
            />
        </div>
    );

    const resourcesContent = (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold">
                        Session Resources
                    </h2>

                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Materials shared by the Admin for this
                        Session.
                    </p>
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void loadResources()}
                    disabled={resourcesLoading || refreshing}
                    className="self-start sm:self-auto text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${resourcesLoading ? "animate-spin text-[var(--color-brand-orange)]" : ""}`} />
                    <span>{resourcesLoading ? "Refreshing..." : "Refresh Resources"}</span>
                </Button>
            </div>

            {resourcesLoading && (
                <div className="rounded-xl border border-[var(--color-border-default)] p-5 text-sm text-[var(--color-text-muted)]">
                    Loading resources...
                </div>
            )}

            {resourcesError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {resourcesError}
                </div>
            )}

            {!resourcesLoading &&
                !resourcesError &&
                resources.length === 0 && (
                    <div className="rounded-xl border border-[var(--color-border-default)] p-5 text-sm text-[var(--color-text-muted)]">
                        No resources have been added for this
                        Session yet.
                    </div>
                )}

            {!resourcesLoading &&
                resources.length > 0 && (
                    <div className="space-y-3">
                        {resources.map((resource) => (
                            <div
                                key={resource.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[var(--color-border-default)] p-4"
                            >
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-[var(--color-text-primary)]">
                                        {resource.title}
                                    </div>

                                    {resource.subtitle && (
                                        <div className="text-xs text-[var(--color-text-muted)] mt-1">
                                            {resource.subtitle}
                                        </div>
                                    )}

                                    <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-text-muted)] mt-2">
                                        {resource.resource_type}
                                    </div>
                                </div>

                                {resource.url && (
                                    <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-4 py-2 text-xs font-bold hover:border-[var(--color-brand-blue)] sm:w-auto"
                                    >
                                        {resource.is_downloadable
                                            ? "Download"
                                            : "Open Resource"}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
        </div>
    );

    const recordingContent = (
        <SessionRecordingTab
            key={`${session.id}-${recordingRefreshKey}`}
            sessionId={session.id}
            sessionTitle={session.title}
            legacyRecordingUrl={session.recording_url}
            legacyTranscriptUrl={session.transcript_url}
        />
    );

    const submissionContent = (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold">
                        Working Board
                    </h2>

                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Open the Working Board and collaborate with your team. Follow the Admin&apos;s instructions and update your work directly in the shared document.
                    </p>
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void loadWorkingBoard(true)}
                    disabled={workingBoardLoading || refreshing}
                    className="self-start sm:self-auto text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${workingBoardLoading ? "animate-spin text-[var(--color-brand-orange)]" : ""}`} />
                    <span>{workingBoardLoading ? "Refreshing..." : "Refresh Board"}</span>
                </Button>
            </div>

            {workingBoardLoading && (
                <div className="rounded-2xl border border-[var(--color-border-default)] p-8 text-center text-sm text-[var(--color-text-muted)]">
                    Loading Working Board...
                </div>
            )}

            {workingBoardError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {workingBoardError}
                </div>
            )}

            {!workingBoardLoading && !workingBoardError && (!workingBoard || !workingBoard.is_published) && (
                <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-8 text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-[var(--color-text-muted)] mx-auto opacity-70" />
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                        Working Board Not Available
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
                        Your Working Board has not been published yet. Please check back later.
                    </p>
                </div>
            )}

            {!workingBoardLoading && !workingBoardError && workingBoard && workingBoard.is_published && (
                <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6 space-y-6">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                            Instructions
                        </h3>
                        <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-4 text-sm text-[var(--color-text-body)] whitespace-pre-wrap leading-relaxed">
                            {workingBoard.instructions || "Follow the collaborative guidelines provided by your mentor and admin."}
                        </div>
                    </div>

                    <div className="pt-2">
                        <a
                            href={workingBoard.working_board_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-blue)] px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:opacity-95"
                        >
                            <span>Click here to open the Working Board and work collaboratively.</span>
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>

                    <div className="border-t border-[var(--color-border-default)] pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[var(--color-text-muted)] gap-2">
                        <span>All team fellows collaborate in this shared Google document.</span>
                        {workingBoard.updated_at && (
                            <span>Updated {new Date(workingBoard.updated_at).toLocaleString()}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const feedbackContent = (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold">
                        Mentor Insights
                    </h2>

                    <p className="text-sm font-medium text-[var(--color-brand-blue)] mt-0.5">
                        Insights provided by the Team&apos;s Mentor.
                    </p>

                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Review the insights provided by your Team&apos;s Mentor and use them to improve your work on the shared Working Board.
                    </p>
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void loadWorkingBoardInsights(true)}
                    disabled={insightsLoading || refreshing}
                    className="self-start sm:self-auto text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${insightsLoading ? "animate-spin text-[var(--color-brand-orange)]" : ""}`} />
                    <span>{insightsLoading ? "Refreshing..." : "Refresh Insights"}</span>
                </Button>
            </div>

            {insightsLoading && (
                <div className="rounded-2xl border border-[var(--color-border-default)] p-8 text-center text-sm text-[var(--color-text-muted)]">
                    Loading Mentor Insights...
                </div>
            )}

            {insightsError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {insightsError}
                </div>
            )}

            {!insightsLoading && !insightsError && (!workingBoardInsights || workingBoardInsights.publication_status !== "published") && (
                <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-8 text-center space-y-2">
                    <MessageSquare className="w-8 h-8 text-[var(--color-text-muted)] mx-auto opacity-70" />
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                        No Insights Yet
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
                        Your team&apos;s Mentor has not provided Mentor Insights yet.
                    </p>
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => selectTab("submission")}
                            className="inline-flex items-center text-xs font-bold text-[var(--color-brand-blue)] hover:underline"
                        >
                            Back to Working Board &rarr;
                        </button>
                    </div>
                </div>
            )}

            {!insightsLoading && !insightsError && workingBoardInsights && workingBoardInsights.publication_status === "published" && (
                <div className="rounded-2xl border border-[var(--color-border-default)] overflow-hidden bg-[var(--color-bg-surface)]">
                    <div className="flex flex-col gap-3 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]/50 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                                {workingBoardInsights.mentor_name ? `Mentor: ${workingBoardInsights.mentor_name}` : "Team Mentor"}
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)] mt-1">
                                {workingBoardInsights.published_at ? `Published ${new Date(workingBoardInsights.published_at).toLocaleString()}` : workingBoardInsights.updated_at ? `Updated ${new Date(workingBoardInsights.updated_at).toLocaleString()}` : ""}
                            </div>
                        </div>

                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold self-start sm:self-auto">
                            Published
                        </span>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                                Mentor Observations
                            </div>
                            <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5 text-sm text-[var(--color-text-body)] whitespace-pre-wrap leading-relaxed">
                                {workingBoardInsights.insights_text}
                            </div>
                        </div>

                        <div className="pt-2 border-t border-[var(--color-border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <span className="text-xs text-[var(--color-text-muted)]">
                                Follow up with your team members to incorporate these insights into your Working Board.
                            </span>
                            <button
                                type="button"
                                onClick={() => selectTab("submission")}
                                className="inline-flex items-center text-xs font-bold text-[var(--color-brand-blue)] hover:underline self-start sm:self-auto"
                            >
                                Back to Working Board &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Map tab key → shared content block
    const tabContentMap: Record<Tab, React.ReactNode> = {
        overview: overviewContent,
        resources: resourcesContent,
        recording: recordingContent,
        submission: submissionContent,
        feedback: feedbackContent,
    };

    return (
        <PortalShell
            breadcrumbItems={[
                session.week_number
                    ? `Week ${session.week_number}`
                    : "Induction",
                `Session ${session.session_number}`,
            ]}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <Link
                        href="/sessions"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sessions
                    </Link>

                    <div className="flex items-center gap-2.5">
                        {lastRefreshedAt && (
                            <span className="hidden sm:inline text-xs text-[var(--color-text-muted)] font-medium">
                                Updated {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="h-9 gap-2 text-xs"
                            title="Refresh session details, meeting link, and resources"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[var(--color-brand-orange)]" : ""}`} />
                            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                        </Button>
                    </div>
                </div>

                {/* ── Session header (shared on all viewports) ── */}
                <div className="overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white">
                    <div className="p-5 sm:p-6 lg:p-8 sm:border-b sm:border-[var(--color-border-default)]">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-brand-orange)]">
                            Session {session.session_number}
                        </div>

                        <h1 className="mt-1 break-words text-2xl font-extrabold md:text-3xl">
                            {session.title}
                        </h1>

                        {session.description && (
                            <p className="mt-3 max-w-3xl break-words text-sm text-[var(--color-text-body)]">
                                {session.description}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-4 mt-5 text-sm text-[var(--color-text-muted)]">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />

                                {session.start_at
                                    ? new Date(
                                        session.start_at
                                    ).toLocaleString()
                                    : "Schedule to be announced"}
                            </div>
                        </div>
                    </div>

                    {/* ────────────────────────────────────────────────────
                        DESKTOP TAB BAR (sm and above) — unchanged
                    ──────────────────────────────────────────────────── */}
                    <div className="hidden sm:block border-b border-[var(--color-border-default)]">
                        <div className="flex overflow-x-auto [scrollbar-width:thin] px-4">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const active = activeTab === tab.key;

                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => selectTab(tab.key)}
                                        className={`flex min-h-12 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap ${active
                                            ? "border-[var(--color-brand-orange)] text-[var(--color-text-primary)]"
                                            : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Desktop tab content panel */}
                    <div className="hidden sm:block p-6 lg:p-8">
                        {tabContentMap[activeTab]}
                    </div>
                </div>

                {/* ────────────────────────────────────────────────────
                    MOBILE ACCORDION (below sm) — orange-bordered cards
                    Each card is independent; only one open at a time.
                    Default: "overview" expanded on load.
                ──────────────────────────────────────────────────── */}
                <div className="sm:hidden space-y-3">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isOpen = mobileOpenSection === tab.key;

                        return (
                            <div
                                key={tab.key}
                                className={`rounded-2xl bg-white overflow-hidden transition-all duration-200 ${isOpen
                                    ? "border-2 border-[var(--color-brand-orange)] shadow-xs"
                                    : "border border-[var(--color-brand-orange)]/60 hover:border-[var(--color-brand-orange)]"
                                    }`}
                            >
                                {/* Accordion header button */}
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    onClick={() => toggleMobileSection(tab.key)}
                                    className="flex w-full min-h-[52px] items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-[var(--color-bg-subtle)]"
                                >
                                    <Icon
                                        className="w-4 h-4 shrink-0 text-[var(--color-brand-orange)]"
                                    />
                                    <span
                                        className="flex-1 text-sm font-semibold text-[var(--color-text-primary)]"
                                    >
                                        {tab.label}
                                    </span>
                                    <ChevronDown
                                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ease-in-out ${isOpen
                                            ? "rotate-180 text-[var(--color-brand-orange)]"
                                            : "rotate-0 text-[var(--color-text-muted)]"
                                            }`}
                                    />
                                </button>

                                {/* Accordion body — rendered when open */}
                                {isOpen && (
                                    <div className="border-t border-[var(--color-border-default)] px-4 py-5">
                                        {tabContentMap[tab.key]}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </PortalShell>
    );
}

export default function SessionWorkspacePage() {
    return (
        <React.Suspense
            fallback={
                <PortalShell breadcrumbItems={["Session"]}>
                    <div className="rounded-2xl border border-[var(--color-border-default)] py-16 text-center text-sm text-[var(--color-text-muted)]">
                        Loading Session...
                    </div>
                </PortalShell>
            }
        >
            <SessionWorkspaceContent />
        </React.Suspense>
    );
}
