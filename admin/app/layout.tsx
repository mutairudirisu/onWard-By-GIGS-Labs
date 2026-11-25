import type { Metadata, Viewport } from "next";
import { Comfortaa } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { AdminGateway } from "@/components/admin-gateway";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  variable: "--font-comfortaa",
});

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await headers();
  return (
    <html lang="en" className={comfortaa.variable}>
      <body>
        <AdminGateway>{children}</AdminGateway>
      </body>
    </html>
  );
}
