import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Linea - Research Provenance Engine | Trace the Lineage of Ideas",
  description: "Linea reconstructs the origin, evolution, and conceptual ancestry of scientific concepts through AI-powered provenance analysis. Discover how ideas emerged, evolved, and shaped modern understanding.",
  keywords: [
    "research provenance",
    "scientific lineage",
    "concept tracing",
    "AI research tool",
    "academic research",
    "scientific evolution",
    "idea ancestry",
    "research papers",
    "conceptual analysis",
    "Gemini AI",
    "Veritus Search"
  ],
  authors: [
    {
      name: "shubhu",
      url: "https://x.com/positronx_"
    }
  ],
  creator: "shubhu",
  publisher: "Linea",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://linea-research-provenance-engine.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Linea - Research Provenance Engine",
    description: "Trace the origin, evolution, and conceptual lineage of scientific ideas through AI-powered provenance analysis.",
    siteName: "Linea",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Linea - Trace the lineage of ideas",
        type: "image/png",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Linea - Research Provenance Engine",
    description: "Trace the origin, evolution, and conceptual lineage of scientific ideas through AI-powered provenance analysis.",
    creator: "@positronx_",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        {children}
        <Toaster />
        <VisualEditsMessenger />
      </body>
    </html>
  );
}