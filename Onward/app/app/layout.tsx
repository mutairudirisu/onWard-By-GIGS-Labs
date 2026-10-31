import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthGate, AuthProvider } from "@/components/auth";
import { NotificationsProvider } from "@/components/notifications";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { Sidebar } from "@/components/sidebar";
import { StoreProvider } from "@/components/store";
import { ThemeManager } from "@/components/theme-manager";

export const metadata: Metadata = {
  title: "onWard — your everyday, going places",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <StoreProvider>
            <AuthGate>
              <NotificationsProvider>
                <ThemeManager />
                <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col bg-cream shadow-lift md:max-w-none md:flex-row md:shadow-none">
                  <Sidebar />
                  <div className="flex min-h-dvh flex-1 flex-col">
                    {children}
                  </div>
                </div>
                <ServiceWorkerRegister />
              </NotificationsProvider>
            </AuthGate>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
