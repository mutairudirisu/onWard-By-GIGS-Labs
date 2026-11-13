import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "onWard — Your growth, documented",
  description:
    "onWard turns the work you already do into a dated record of wins, impact and proof — then compiles it into a portfolio you can share at review time.",
  metadataBase: new URL("https://getonward.vercel.app"),
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0D08",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await headers();
  return (
    <html lang="en">
      <body>
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
