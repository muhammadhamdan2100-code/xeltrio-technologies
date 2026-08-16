"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "glass-panel border-b" : "border-b border-transparent"
      )}
    >
      <nav className="mx-auto flex h-[76px] max-w-[1400px] items-center px-6 lg:px-12" aria-label="Primary">
        {/* Brand: Logo + XELTRIO TECHNOLOGIES on far left */}
        <div className="mr-8 flex items-center gap-2.5 shrink-0">
          <Link href="/" aria-label="Xeltrio Technologies home" className="group flex items-center gap-2.5">
            <Image src="/xeltrio-icon.png" alt="" width={34} height={34} priority className="h-[34px] w-auto transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
            <span className="font-display text-[17px] font-semibold tracking-[0.14em] text-[color:var(--color-text-primary)] transition-colors duration-300 group-hover:text-[color:var(--color-accent-primary)]">
              XELTRIO TECHNOLOGIES
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden flex-1 items-center justify-center gap-6 lg:flex">
          {NAV_LINKS.map((link) =>
            "children" in link && link.children ? (
              <li key={link.label} className="group relative">
                <button
                  type="button"
                  className="flex items-center gap-1 font-mono-tech text-[13px] tracking-[0.02em] text-[color:var(--color-text-secondary)] transition-colors duration-300 hover:text-[color:var(--color-text-primary)]"
                >
                  {link.label}
                  <ChevronDown size={13} className="transition-transform duration-300 group-hover:rotate-180" />
                </button>

                <div className="invisible absolute left-1/2 top-full w-[300px] -translate-x-1/2 pt-4 opacity-0 transition-all duration-300 group-hover:visible group-hover:opacity-100">
                  <div className="glass-panel rounded-2xl border p-2">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-xl px-4 py-3 transition-colors duration-200 hover:bg-[color:var(--color-bg-elevated)]"
                      >
                        <p className="font-display text-sm font-semibold text-[color:var(--color-text-primary)]">
                          {child.label}
                        </p>
                        <p className="mt-0.5 text-xs text-[color:var(--color-text-muted)]">{child.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </li>
            ) : (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-mono-tech text-[13px] tracking-[0.02em] text-[color:var(--color-text-secondary)] transition-colors duration-300 hover:text-[color:var(--color-text-primary)] whitespace-nowrap"
                >
                  {link.label}
                </Link>
              </li>
            )
          )}
        </ul>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text-primary)] lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="glass-panel max-h-[calc(100svh-76px)] overflow-y-auto border-t px-6 py-6 lg:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) =>
              "children" in link && link.children ? (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => setOpenMobileGroup((v) => (v === link.label ? null : link.label))}
                    className="flex w-full items-center justify-between py-3 font-mono-tech text-sm text-[color:var(--color-text-secondary)]"
                    aria-expanded={openMobileGroup === link.label}
                  >
                    {link.label}
                    <ChevronDown
                      size={15}
                      className={cn("transition-transform duration-300", openMobileGroup === link.label && "rotate-180")}
                    />
                  </button>
                  {openMobileGroup === link.label && (
                    <ul className="flex flex-col gap-1 pb-2 pl-4">
                      {link.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="block py-2 text-sm text-[color:var(--color-text-muted)]"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ) : (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 font-mono-tech text-sm text-[color:var(--color-text-secondary)] whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
