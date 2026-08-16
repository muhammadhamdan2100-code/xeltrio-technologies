import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy — Xeltrio Technologies",
  description: "How Xeltrio Technologies will handle personal data once BusinessOS and its ecosystem are live. Currently a placeholder.",
};

export default async function PrivacyPolicyPage() {
  return <LegalDocument slug="privacy-policy" />;
}
