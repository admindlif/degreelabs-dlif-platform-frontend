import { Clock, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SessionSummary } from "@/lib/api/types";

interface LiveSessionSpotlightProps {
  session?: SessionSummary | null;
}

function formatSessionTime(
  startValue?: string | null,
  endValue?: string | null
) {
  if (!startValue) return "Schedule to be announced";

  const start = new Date(startValue);
  const end = endValue ? new Date(endValue) : null;

  if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) {
    return "Schedule to be announced";
  }

  const date = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startTime = start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = end
    ? end.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })
    : null;

  return `${date}, ${startTime}${endTime ? ` – ${endTime}` : ""}`;
}

export function LiveSessionSpotlight({ session }: LiveSessionSpotlightProps) {
  if (!session) {
    return (
      <Card
        variant="elevated"
        className="h-full flex min-h-[300px] flex-col justify-between"
      >
        <div>
          <div className="mb-6 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-brand-orange)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-orange)]">
              Upcoming Session
            </span>
          </div>

          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-brand-orange)]">
            <Clock className="h-5 w-5" />
          </div>

          <CardTitle className="text-2xl font-extrabold md:text-3xl">
            No upcoming Session
          </CardTitle>

          <CardDescription className="mt-3 max-w-xl text-base leading-6 text-[var(--color-text-body)]">
            Your next Session will appear here once it is scheduled for your Team.
          </CardDescription>
        </div>

        <div className="mt-8 border-t border-[var(--color-border-default)] pt-6">
          <Button
            variant="primary"
            size="lg"
            disabled
            className="w-full sm:w-auto"
          >
            <Clock className="h-4 w-4" />
            <span>Schedule to be announced</span>
          </Button>
        </div>
      </Card>
    );
  }

  const isLocked = !session.is_unlocked;
  const isLive = session.status === "live";
  const sessionHasEnded =
    session.status === "completed" ||
    (!!session.end_at && new Date(session.end_at).getTime() < Date.now());

  const sessionBadgeLabel = session.session_type === "induction"
    ? "Session 0: Induction"
    : session.session_type === "output_review"
      ? `Session ${session.session_number}: Output + Review (Gate)`
      : `Session ${session.session_number}: Learn + Work`;

  return (
    <Card variant="elevated" className="h-full flex flex-col justify-between">
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-brand-orange)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-orange)]">
              {isLive ? "Live Now" : "Next Live Session"}
            </span>
          </div>
          <Badge variant="blue" size="sm" className="max-w-full truncate">
            {sessionBadgeLabel}
          </Badge>
        </div>

        <CardTitle className="mb-2 break-words text-2xl font-extrabold md:text-3xl">
          {isLocked ? `Session ${session.session_number}` : session.title}
        </CardTitle>

        <CardDescription className="mb-6 text-base text-[var(--color-text-body)]">
          {isLocked
            ? "This Session has not been unlocked yet."
            : session.description || "Session details will be available here."}
        </CardDescription>

        <div className="mb-6 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-white text-[var(--color-brand-orange)] shadow-xs">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Time & Date</p>
              <p className="break-words text-sm font-bold text-[var(--color-text-primary)]">
                {isLocked
                  ? "Locked"
                  : formatSessionTime(session.start_at, session.end_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-border-default)] pt-6">
        {sessionHasEnded ? (
          <Button variant="primary" size="lg" disabled className="w-full sm:w-auto">
            <Video className="h-4 w-4" />
            <span>Session completed</span>
          </Button>
        ) : session.meeting_url && !isLocked ? (
          <a
            href={session.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[var(--color-brand-orange)] px-7 py-3.5 text-base font-bold tracking-tight text-white shadow-sm transition-all duration-200 hover:bg-[var(--color-brand-orange-hover)] hover:shadow sm:w-auto"
          >
            <Video className="h-4 w-4" />
            <span>Join Google Meet</span>
          </a>
        ) : (
          <Button variant="primary" size="lg" disabled className="w-full sm:w-auto">
            <Video className="h-4 w-4" />
            <span>{isLocked ? "Session Locked" : "Meeting Link Coming Soon"}</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
