import type { Metadata, Viewport } from "next";
import { Comfortaa } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { AppProviders, AppEffects, AppOverlays, ServiceWorkerRegister } from "@/components/providers";
import { AppShell } from "@/components/layout";
import { ToastHost } from "@/components/ui";

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
  await headers();
  return (
    <html lang="en" className={comfortaa.variable}>
      <body>
        <AppProviders>
          <AppEffects />
          <AppShell>{children}</AppShell>
          <AppOverlays />
        </AppProviders>
        <ServiceWorkerRegister />
        <ToastHost />
      </body>
    </html>
  );
}
