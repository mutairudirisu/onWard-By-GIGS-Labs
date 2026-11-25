"use client";

import type { ReactNode } from "react";
import { AuthGate, AuthProvider } from "@/components/providers/auth";
import { StoreProvider } from "@/components/providers/store";
import { NotificationsProvider } from "@/components/providers/notifications";

/**
 * AppProviders encapsulates the nested context providers and auth boundary
 * in strict dependency order (Auth -> Store -> AuthGate -> Notifications).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <AuthGate>
          <NotificationsProvider>
            {children}
          </NotificationsProvider>
        </AuthGate>
      </StoreProvider>
    </AuthProvider>
  );
}

export default AppProviders;
