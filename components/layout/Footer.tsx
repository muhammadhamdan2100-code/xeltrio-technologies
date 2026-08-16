import Image from "next/image";
import Link from "next/link";
import {
  FOOTER_COMPANY_LINKS,
  FOOTER_INDUSTRIES_LINKS,
  FOOTER_LEGAL_LINKS,
  FOOTER_PRODUCT_LINKS,
  FOOTER_RESOURCE_LINKS,
  FOOTER_SOLUTIONS_LINKS,
} from "@/lib/constants";

const FOOTER_COLUMNS = [
  { heading: "Company", links: FOOTER_COMPANY_LINKS },
  { heading: "Products", links: FOOTER_PRODUCT_LINKS },
  { heading: "Solutions", links: FOOTER_SOLUTIONS_LINKS },
  { heading: "Industries", links: FOOTER_INDUSTRIES_LINKS },
  { heading: "Resources", links: FOOTER_RESOURCE_LINKS },
  { heading: "Legal", links: FOOTER_LEGAL_LINKS },
];

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)]">
      <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-12">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-8">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/xeltrio-icon.png" alt="Xeltrio Technologies" width={30} height={30} className="h-[30px] w-auto" />
              <span className="font-display text-sm font-semibold tracking-[0.14em] text-[color:var(--color-text-primary)]">
                XELTRIO
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-[color:var(--color-text-muted)]">
              An AI product company building intelligent operating systems for global enterprise —
              one intelligence layer, an entire ecosystem of products.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="font-mono-tech text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                {col.heading}
              </h3>
              <ul className="mt-5 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[color:var(--color-text-secondary)] transition-colors hover:text-[color:var(--color-text-primary)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-[color:var(--color-border-subtle)] pt-8 md:flex-row md:items-center">
          <p className="text-xs text-[color:var(--color-text-muted)]">
            © {new Date().getFullYear()} Xeltrio Technologies Private Limited. All rights reserved.
          </p>
          <p className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">
            Founded by Muhammad Hamdan
          </p>
        </div>
      </div>
    </footer>
  );
}
