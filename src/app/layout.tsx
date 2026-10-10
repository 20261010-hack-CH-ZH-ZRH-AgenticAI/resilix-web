import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { PwaRegistration } from "@/features/shell/PwaRegistration";
import { PreferencesProvider } from "@/lib/i18n/Provider";
import "@/styles/globals.css";
export const metadata: Metadata = {
  title: "Resilix — Clarity when it matters",
  description:
    "Swiss emergency intelligence. Source-linked awareness, private alerts and a thoughtful AI assistant.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Resilix" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#d6f176",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await headers();
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PreferencesProvider>
          {children}
          <PwaRegistration />
        </PreferencesProvider>
      </body>
    </html>
  );
}
