"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface PortalShellProps {
  children: React.ReactNode;
  breadcrumbItems?: string[];
  unreadNotifications?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function PortalShell({
  children,
  breadcrumbItems = [],
  unreadNotifications = 0,
  onRefresh,
  isRefreshing,
}: PortalShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const breadcrumbs = React.useMemo(() => {
    return ["Mentor Portal", ...breadcrumbItems];
  }, [breadcrumbItems]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] flex text-[var(--color-text-primary)]">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden cursor-pointer"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <Sidebar
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          breadcrumbs={breadcrumbs}
          roleTitle="Mentor Portal"
          unreadNotifications={unreadNotifications}
          onMenuClick={() => setMobileNavOpen(true)}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
        <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
