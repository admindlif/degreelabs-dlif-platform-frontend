"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { SessionExpiryModal } from "@/components/auth/session-expiry-modal";
import {
  adminSessionClient,
  SessionNetworkError,
  type SessionActivity,
  type SessionStatus,
} from "@/lib/auth/session-client";
import {
  ACTIVITY_THROTTLE_MS,
  canExtendSession,
  getRemainingSeconds,
  getSessionPhase,
  type SessionDeadlines,
} from "@/lib/auth/session-policy";

interface AdminSessionLifecycleProps {
  active: boolean;
  onLogout: () => Promise<unknown>;
  onRemoteLogout: () => void;
}

function hasDeadlines(status: SessionStatus | null): status is SessionStatus & SessionDeadlines {
  return Boolean(status?.authenticated && status.inactivity_expires_at && status.absolute_expires_at && status.effective_expires_at);
}

function mergeActivity(current: SessionStatus | null, activity: SessionActivity): SessionStatus {
  return {
    authenticated: true,
    inactivity_expires_at: activity.inactivity_expires_at,
    absolute_expires_at: activity.absolute_expires_at,
    effective_expires_at: activity.effective_expires_at,
    access_expires_at: current?.access_expires_at ?? null,
    server_time: activity.server_time,
  };
}

export function AdminSessionLifecycle({ active, onLogout, onRemoteLogout }: AdminSessionLifecycleProps) {
  const pathname = usePathname();
  const [status, setStatus] = React.useState<SessionStatus | null>(null);
  const [now, setNow] = React.useState(() => Date.now());
  const [expired, setExpired] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const lastActivity = React.useRef(0);
  const activityPromise = React.useRef<Promise<void> | null>(null);
  const previousPathname = React.useRef(pathname);
  const expirationAnnounced = React.useRef(false);

  const syncStatus = React.useCallback(async () => {
    try {
      const next = await adminSessionClient.getStatus();
      setStatus(next);
      if (!next.authenticated) setExpired(true);
    } catch (error) {
      if (!(error instanceof SessionNetworkError)) throw error;
    }
  }, []);

  const sendActivity = React.useCallback(async (force: boolean) => {
    if (!active || activityPromise.current) return activityPromise.current;
    if (!force && Date.now() - lastActivity.current < ACTIVITY_THROTTLE_MS) return;
    const work = (async () => {
      try {
        const activity = await adminSessionClient.recordActivity();
        if (!activity) { setExpired(true); return; }
        lastActivity.current = Date.now();
        setExpired(false);
        const next = mergeActivity(status, activity);
        setStatus(next);
        adminSessionClient.announce({ type: "session-updated", status: next });
      } catch (error) {
        if (!(error instanceof SessionNetworkError)) throw error;
      }
    })().finally(() => { activityPromise.current = null; });
    activityPromise.current = work;
    return work;
  }, [active, status]);

  React.useEffect(() => {
    if (!active) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void syncStatus();
  }, [active, syncStatus]);

  React.useEffect(() => adminSessionClient.subscribe((event) => {
    if (event.type === "logout") onRemoteLogout();
    if (event.type === "session-expired") setExpired(true);
    if ((event.type === "session-updated" || event.type === "refresh-complete") && event.status) {
      setStatus(event.status);
      setExpired(false);
    }
  }), [onRemoteLogout]);

  React.useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [active]);

  React.useEffect(() => {
    if (!active) return;
    const interaction = () => void sendActivity(false);
    window.addEventListener("pointerdown", interaction, { passive: true });
    window.addEventListener("keydown", interaction);
    return () => {
      window.removeEventListener("pointerdown", interaction);
      window.removeEventListener("keydown", interaction);
    };
  }, [active, sendActivity]);

  React.useEffect(() => {
    if (!active || previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    void sendActivity(false);
  }, [active, pathname, sendActivity]);

  React.useEffect(() => {
    if (!active) return;
    const restored = () => {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
        void syncStatus();
      }
    };
    document.addEventListener("visibilitychange", restored);
    window.addEventListener("pageshow", restored);
    window.addEventListener("focus", restored);
    return () => {
      document.removeEventListener("visibilitychange", restored);
      window.removeEventListener("pageshow", restored);
      window.removeEventListener("focus", restored);
    };
  }, [active, syncStatus]);

  const current = active ? status : null;
  const phase = hasDeadlines(current) ? getSessionPhase(current, now) : "active";
  const remaining = hasDeadlines(current) ? getRemainingSeconds(current, now) : 0;
  const canExtend = hasDeadlines(current) ? canExtendSession(current, now) : true;

  React.useEffect(() => {
    if (!active) return;
    if (phase === "expired" && !expirationAnnounced.current) {
      expirationAnnounced.current = true;
      setExpired(true);
      adminSessionClient.announce({ type: "session-expired" });
    } else if (phase !== "expired") {
      expirationAnnounced.current = false;
    }
  }, [active, phase]);

  const staySignedIn = async () => {
    if (!canExtend) return;
    setBusy(true);
    try { await sendActivity(true); await syncStatus(); } finally { setBusy(false); }
  };

  const logout = async () => {
    setBusy(true);
    try { await onLogout(); } finally { setBusy(false); }
  };

  return (
    <SessionExpiryModal
      open={active && (expired || phase === "warning")}
      expired={expired || phase === "expired"}
      canExtend={canExtend}
      remainingSeconds={remaining}
      busy={busy}
      onStaySignedIn={() => void staySignedIn()}
      onLogout={() => void logout()}
    />
  );
}
