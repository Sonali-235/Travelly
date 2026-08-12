import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

// Loaded via a plain <link> tag below instead of next/font/google. next/font
// downloads fonts from Google's servers DURING the Vercel build itself — if
// that network call flakes (as it just did), the entire deployment fails.
// A <link> tag loads fonts in the visitor's browser at page-load time
// instead, which can't break a build. Trade-off: a few KB slower initial
// paint versus a build that can't fail on Google's server being slow.

export const metadata: Metadata = {
  title: "Travelly — Personalized Itinerary Planner",
  description:
    "Personalized India travel itineraries — AI-planned, admin-verified.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-canvas text-ink font-sans antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
