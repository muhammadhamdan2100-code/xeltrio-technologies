import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { ProductGlyph } from "@/components/ui/ProductGlyph";
import { ECOSYSTEM_PRODUCTS } from "@/lib/constants";

export function ProductPreview() {
  return (
    <section id="ecosystem" className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-28 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <Reveal className="flex max-w-2xl flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div>
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              OUR ECOSYSTEM
            </span>
            <h2 className="mt-5 font-display text-[34px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[42px]">
              One intelligence layer. An entire ecosystem.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
              Every product below runs on the same BusinessOS core — the same AI intelligence,
              the same security model, the same architecture, adapted to a different vertical.
            </p>
          </div>
        </Reveal>

        <RevealGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ECOSYSTEM_PRODUCTS.map((product, i) => (
            <RevealItem key={product.name}>
              <div className="glass-panel group flex h-full flex-col rounded-2xl p-6 transition-transform duration-500 hover:-translate-y-1.5">
                <ProductGlyph seed={i + 1} />
                <div className="mt-6 flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                    {product.name}
                  </h3>
                  <span className="whitespace-nowrap rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-mono-tech text-[10px] tracking-[0.06em] text-[color:var(--color-accent-secondary)]">
                    {product.badge}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                  {product.description}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.1} className="mt-14 flex justify-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-6 py-3 text-sm font-medium text-[color:var(--color-text-primary)] transition-all duration-300 hover:border-[color:var(--color-accent-primary)] hover:bg-[color:var(--color-accent-primary)]/10"
          >
            View the full product lineup
            <ArrowUpRight size={15} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
