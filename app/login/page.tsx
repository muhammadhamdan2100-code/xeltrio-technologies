import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthForm, AuthLink } from "@/components/auth/AuthForm";
import { signInAction } from "@/app/auth/actions";
import { loadPrincipal } from "@/lib/authz/guards";

export const metadata: Metadata = {
  title: "Sign in — Xeltrio Technologies",
  description: "Sign in to the Xeltrio Technologies administration area.",
  robots: { index: false, follow: false },
};

function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) return null;
  return next;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeNext(next ?? null) ?? "/admin";

  // Already signed in? Skip the form. (Proxy is only an early guard; this is server-side.)
  const existing = await loadPrincipal();
  if (existing.ok) redirect(target);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[color:var(--color-bg-primary)] px-6 py-24">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
          XELTRIO
        </Link>

        <div className="mt-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
            Administration access for authorized Xeltrio team members.
          </p>

          <AuthForm
            action={signInAction}
            hidden={{ next: target }}
            submitLabel="Sign in"
            fields={[
              { name: "email", label: "Email", type: "email", autoComplete: "email" },
              { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
            ]}
            footer={
              <div className="mt-2 flex flex-col gap-2">
                <AuthLink href="/forgot-password">Forgot password?</AuthLink>
              </div>
            }
          />
        </div>

        <p className="mt-6 text-center text-xs text-[color:var(--color-text-muted)]">
          Accounts are provisioned by an administrator. There is no public signup.
        </p>
      </div>
    </main>
  );
}
