import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AdminGateway } from "@/components/admin-gateway";

export const metadata: Metadata = {
  title: "onWard Admin",
  description:
    "Manage users, send notification broadcasts and watch onWard grow.",
  icons: { icon: "/icons/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F6F6F0",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AdminGateway>{children}</AdminGateway>
      </body>
    </html>
  );
}
