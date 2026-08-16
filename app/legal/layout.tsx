import { ReactNode } from "react";
import { PageShell } from "@/components/layout/PageShell";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
