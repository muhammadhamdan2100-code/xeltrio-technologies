import { requirePermission } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function AdminProductsPage() {
  await requirePermission("products", "view", "/admin/products");

  const supabase = await createSupabaseServer();
  const { data: products } = await supabase
    .from("products")
    .select("name,slug,status,category_id,sort_order")
    .order("sort_order");
  const { data: categories } = await supabase.from("product_categories").select("name,slug");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">Products</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          {products?.length ?? 0} products · {categories?.length ?? 0} categories.{" "}
          {(products ?? []).filter((p) => !p.category_id).length} rows currently have no category — the
          assignment is an owner/content decision and has deliberately not been written.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(categories ?? []).map((c) => (
          <span
            key={String(c.slug)}
            className="rounded-full border border-[color:var(--color-border)] px-4 py-1 font-mono-tech text-xs text-[color:var(--color-text-muted)]"
          >
            {String(c.name)}
          </span>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(products ?? []).map((p) => (
          <div
            key={String(p.slug)}
            className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5"
          >
            <p className="font-display text-base font-semibold text-[color:var(--color-text-primary)]">
              {String(p.name)}
            </p>
            <p className="mt-1 font-mono-tech text-xs text-[color:var(--color-text-muted)]">
              {String(p.slug)} · {String(p.status)} · {p.category_id ? "categorised" : "no category"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
