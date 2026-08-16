import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Disclaimer — Xeltrio Technologies",
  description: "General disclaimers covering the information published on the Xeltrio Technologies website. Currently a placeholder.",
};

export default async function DisclaimerPage() {
  return <LegalDocument slug="disclaimer" />;
}
