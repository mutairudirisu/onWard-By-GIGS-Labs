"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { RouteLoadingBoundary } from "@/components/layout/route-loading-boundary";

/**
 * AppShell renders the main application layout frame:
 * - Desktop sticky sidebar on the left (md:flex)
 * - Main content column on the right wrapped with the route transition loader
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-cream md:flex-row">
      <Sidebar />
      <div className="flex min-h-dvh flex-1 flex-col">
        <RouteLoadingBoundary>{children}</RouteLoadingBoundary>
      </div>
    </div>
  );
}

export default AppShell;
