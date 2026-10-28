"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { SessionExpiryModal } from "@/components/auth/session-expiry-modal";
import {
  fellowSessionClient,
  SessionNetworkError,
  type SessionActivity,
  type SessionStatus,
} from "@/lib/auth/session-client";
import {
  canExtendSession,
  getRemainingSeconds,
  getSessionPhase,
  type SessionDeadlines,
} from "@/lib/auth/session-policy";

const ACTIVITY_THROTTLE_MS = 5 * 60 * 1000;

interface FellowSessionLifecycleProps {
  active: boolean;
  onLogout: () => Promise<void>;
  onRemoteLogout: () => void;
}

function hasDeadlines(status: SessionStatus | null): status is SessionStatus & SessionDeadlines {
  return Boolean(
    status?.authenticated &&
      status.inactivity_expires_at &&
      status.absolute_expires_at &&
      status.effective_expires_at
  );
}

function mergeActivity(
  current: SessionStatus | null,
  activity: SessionActivity
): SessionStatus {
  return {
    authenticated: true,
    inactivity_expires_at: activity.inactivity_expires_at,
    absolute_expires_at: activity.absolute_expires_at,
    effective_expires_at: activity.effective_expires_at,
    access_expires_at: current?.access_expires_at ?? null,
    server_time: activity.server_time,
  };
}

export function FellowSessionLifecycle({
  active,
  onLogout,
  onRemoteLogout,
}: FellowSessionLifecycleProps) {
  const pathname = usePathname();
  const [status, setStatus] = React.useState<SessionStatus | null>(null);
  const [now, setNow] = React.useState(() => Date.now());
  const [expired, setExpired] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const lastActivitySentAt = React.useRef(0);
  const activityPromise = React.useRef<Promise<void> | null>(null);
  const previousPathname = React.useRef(pathname);
  const expirationAnnounced = React.useRef(false);

  const syncStatus = React.useCallback(async () => {
    try {
      const next = await fellowSessionClient.getStatus();
      setStatus(next);
      if (!next.authenticated) setExpired(true);
    } catch (error) {
      if (!(error instanceof SessionNetworkError)) throw error;
      // A temporary network failure must not destroy authenticated UI state.
    }
  }, []);

  const sendActivity = React.useCallback(
    async (force: boolean) => {
      if (!active || activityPromise.current) return activityPromise.current;
      const currentTime = Date.now();
      if (!force && currentTime - lastActivitySentAt.current < ACTIVITY_THROTTLE_MS) {
        return;
      }

      const work = (async () => {
        try {
          const activity = await fellowSessionClient.recordActivity();
          if (!activity) {
            setExpired(true);
            return;
          }
          lastActivitySentAt.current = Date.now();
          setExpired(false);
          const next = mergeActivity(status, activity);
          setStatus(next);
          fellowSessionClient.announce({ type: "session-updated", status: next });
        } catch (error) {
          if (!(error instanceof SessionNetworkError)) throw error;
        }
      })().finally(() => {
        activityPromise.current = null;
      });
      activityPromise.current = work;
      return work;
    },
    [active, status]
  );

  React.useEffect(() => {
    if (!active) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void syncStatus();
  }, [active, syncStatus]);

  React.useEffect(
    () =>
      fellowSessionClient.subscribe((event) => {
        if (event.type === "logout") {
          onRemoteLogout();
        } else if (event.type === "session-expired") {
          setExpired(true);
        } else if (
          (event.type === "session-updated" || event.type === "refresh-complete") &&
          event.status
        ) {
          setStatus(event.status);
          setExpired(false);
        }
      }),
    [onRemoteLogout]
  );

  React.useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [active]);

  React.useEffect(() => {
    if (!active) return;
    const handleInteraction = () => void sendActivity(false);
    window.addEventListener("pointerdown", handleInteraction, { passive: true });
    window.addEventListener("keydown", handleInteraction);
    return () => {
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [active, sendActivity]);

  React.useEffect(() => {
    if (!active || previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    void sendActivity(false);
  }, [active, pathname, sendActivity]);

  React.useEffect(() => {
    if (!active) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
        void syncStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [active, syncStatus]);

  const currentStatus = active ? status : null;
  const currentExpired = active ? expired : false;
  const phase = hasDeadlines(currentStatus) ? getSessionPhase(currentStatus, now) : "active";
  const remainingSeconds = hasDeadlines(currentStatus)
    ? getRemainingSeconds(currentStatus, now)
    : 0;
  const canExtend = hasDeadlines(currentStatus) ? canExtendSession(currentStatus, now) : true;

  React.useEffect(() => {
    if (!active) return;
    if (phase === "expired" && !expirationAnnounced.current) {
      expirationAnnounced.current = true;
      setExpired(true);
      fellowSessionClient.announce({ type: "session-expired" });
    } else if (phase !== "expired") {
      expirationAnnounced.current = false;
    }
  }, [active, phase]);

  const staySignedIn = React.useCallback(async () => {
    if (!canExtend) return;
    setBusy(true);
    try {
      await sendActivity(true);
      await syncStatus();
    } finally {
      setBusy(false);
    }
  }, [canExtend, sendActivity, syncStatus]);

  const logout = React.useCallback(async () => {
    setBusy(true);
    try {
      await onLogout();
    } finally {
      setBusy(false);
    }
  }, [onLogout]);

  return (
    <SessionExpiryModal
      open={active && (currentExpired || phase === "warning")}
      expired={currentExpired || phase === "expired"}
      canExtend={canExtend}
      remainingSeconds={remainingSeconds}
      busy={busy}
      onStaySignedIn={() => void staySignedIn()}
      onLogout={() => void logout()}
    />
  );
}
