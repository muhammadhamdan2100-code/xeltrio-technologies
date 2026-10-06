import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { resetPasswordAction } from "@/app/auth/actions";
import { loadPrincipal } from "@/lib/authz/guards";

export const metadata: Metadata = {
  title: "Choose a new password — Xeltrio Technologies",
  description: "Set a new password using your recovery link.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  // A recovery link is only usable while the exchanged session is still valid.
  const principal = await loadPrincipal();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[color:var(--color-bg-primary)] px-6 py-24">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
          XELTRIO
        </Link>

        <div className="mt-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">
            New password
          </h1>

          {principal.ok ? (
            <AuthForm
              action={resetPasswordAction}
              submitLabel="Update password"
              fields={[
                {
                  name: "password",
                  label: "New password",
                  type: "password",
                  autoComplete: "new-password",
                  hint: "At least 8 characters.",
                },
                { name: "confirm", label: "Confirm password", type: "password", autoComplete: "new-password" },
              ]}
            />
          ) : (
            <>
              <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">
                This recovery link is no longer valid or has already been used. Request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-block rounded-xl bg-[color:var(--color-accent-primary)] px-5 py-3 font-display text-sm font-semibold text-white"
              >
                Request a new link
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
