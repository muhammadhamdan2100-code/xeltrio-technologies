import { ReactNode } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { BusinessOSSubNav } from "@/components/businessos/BusinessOSSubNav";

export default function BusinessOSLayout({ children }: { children: ReactNode }) {
  return (
    <PageShell>
      <BusinessOSSubNav />
      {children}
    </PageShell>
  );
}
