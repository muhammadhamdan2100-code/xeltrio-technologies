import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";
import { CursorLoader } from "@/components/cursor/CursorLoader";

// Fonts are self-hosted via @fontsource (zero external requests, no
// layout-shift risk from a third-party font CDN) and mapped onto CSS
// variables defined globally in globals.css (--font-space-grotesk, etc).

export const metadata: Metadata = {
  title: "Xeltrio Technologies — Intelligent Operating Systems for the Enterprise",
  description:
    "Xeltrio Technologies builds AI-native operating systems for global enterprise — BusinessOS, EducationOS, and a growing ecosystem of intelligent software, backed by the HamiaWorks AI services division.",
  keywords: [
    "Xeltrio Technologies",
    "AI operating system",
    "BusinessOS",
    "EducationOS",
    "enterprise AI software",
    "HamiaWorks AI",
  ],
  openGraph: {
    title: "Xeltrio Technologies — Intelligent Operating Systems for the Enterprise",
    description:
      "AI-native operating systems for global enterprise. One intelligence layer, an entire ecosystem of products.",
    type: "website",
  },
  icons: {
    icon: "/xeltrio-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="grain-overlay" aria-hidden="true" />
        <CursorLoader />
        {children}
      </body>
    </html>
  );
}
