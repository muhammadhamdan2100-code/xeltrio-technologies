import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Service — Xeltrio Technologies",
  description: "The terms that will govern use of the Xeltrio Technologies website and BusinessOS platform. Currently a placeholder.",
};

export default async function TermsOfServicePage() {
  return <LegalDocument slug="terms-of-service" />;
}
