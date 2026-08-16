import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Cookie Policy — Xeltrio Technologies",
  description: "How cookies and similar technologies will be used across Xeltrio Technologies' digital properties. Currently a placeholder.",
};

export default async function CookiePolicyPage() {
  return <LegalDocument slug="cookie-policy" />;
}
