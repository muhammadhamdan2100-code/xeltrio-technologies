import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm, AuthLink } from "@/components/auth/AuthForm";
import { forgotPasswordAction } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Reset your password — Xeltrio Technologies",
  description: "Request a password recovery link for your Xeltrio administration account.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[color:var(--color-bg-primary)] px-6 py-24">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
          XELTRIO
        </Link>

        <div className="mt-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">
            Forgot password
          </h1>
          <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
            We will send a single-use recovery link. The response below is identical whether or not an
            account exists for that address.
          </p>

          <AuthForm
            action={forgotPasswordAction}
            submitLabel="Send recovery link"
            fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
            footer={<AuthLink href="/login">Back to sign in</AuthLink>}
          />
        </div>
      </div>
    </main>
  );
}
