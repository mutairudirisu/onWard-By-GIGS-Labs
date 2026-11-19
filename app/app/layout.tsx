import type { Metadata, Viewport } from "next";
import { Comfortaa } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import "./globals.css";
import { AuthGate, AuthProvider } from "@/components/auth";
import { ChecklistReminderScheduler } from "@/components/checklist-widget";
import { FeedbackPrompt } from "@/components/feedback-prompt";
import { InstallFromLink } from "@/components/install-from-link";
import { NotificationsProvider } from "@/components/notifications";
import { NavigationHistoryTracker } from "@/components/navigation-history";
import { FocusTimerScheduler } from "@/components/pomodoro-widget";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { Sidebar } from "@/components/sidebar";
import { StoreProvider } from "@/components/store";
import { ThemeManager } from "@/components/theme-manager";
import { ToastHost } from "@/components/toast";
import { UpdatePrompt } from "@/components/update-prompt";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  variable: "--font-comfortaa",
});

export const metadata: Metadata = {
  title: "onWard",
  description:
    "Plan your day, capture your wins and build a story of your work you're proud to share.",
  manifest: "/manifest.webmanifest",
  applicationName: "onWard",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "onWard",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "512x512" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F6F6F0",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  return (
    <html lang="en" className={comfortaa.variable}>
      <body>
        <Script id="onward-install-capture" strategy="beforeInteractive" nonce={nonce}>
          {`(() => {
            const url = new URL(window.location.href);
            if (url.searchParams.get("install") !== "1") return;

            const standalone =
              window.matchMedia("(display-mode: standalone)").matches ||
              window.navigator.standalone === true;
            const state = window.__onWardInstallState = {
              requested: !standalone,
              installed: standalone,
              prompt: null
            };

            url.searchParams.delete("install");
            window.history.replaceState(
              window.history.state,
              "",
              url.pathname + url.search + url.hash
            );

            if (standalone) return;

            window.addEventListener("beforeinstallprompt", (event) => {
              event.preventDefault();
              if (!state.requested) return;
              state.prompt = event;
              window.dispatchEvent(new Event("onwardinstallpromptready"));
            });
            window.addEventListener("appinstalled", () => {
              state.installed = true;
              state.requested = false;
              state.prompt = null;
              window.dispatchEvent(new Event("onwardappinstalled"));
            });
          })();`}
        </Script>
        <AuthProvider>
          <InstallFromLink />
          <StoreProvider>
            <AuthGate>
              <NotificationsProvider>
                <NavigationHistoryTracker />
                <ThemeManager />
                <ChecklistReminderScheduler />
                <FocusTimerScheduler />
                <div className="flex min-h-dvh w-full flex-col bg-cream md:flex-row">
                  <Sidebar />
                  <div className="flex min-h-dvh flex-1 flex-col">{children}</div>
                </div>
                <ServiceWorkerRegister />
                <UpdatePrompt />
                <FeedbackPrompt />
                <ToastHost />
              </NotificationsProvider>
            </AuthGate>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
