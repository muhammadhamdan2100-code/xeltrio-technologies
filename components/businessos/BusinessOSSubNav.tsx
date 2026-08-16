"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BUSINESSOS_SUBNAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function BusinessOSSubNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-[76px] z-40 mt-[76px] border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)]/85 backdrop-blur-xl">
      <nav className="mx-auto max-w-[1400px] px-6 lg:px-12" aria-label="BusinessOS">
        <ul className="flex gap-1 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {BUSINESSOS_SUBNAV.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  data-cursor="button"
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-full px-4 py-2 font-mono-tech text-[12px] tracking-[0.04em] transition-colors duration-300",
                    active
                      ? "bg-[color:var(--color-accent-primary)]/15 text-[color:var(--color-text-primary)]"
                      : "text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
