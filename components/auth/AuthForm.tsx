"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { FormState } from "@/app/auth/actions";

type Field = { name: string; label: string; type: string; autoComplete?: string; hint?: string };

export function AuthForm({
  action,
  fields,
  submitLabel,
  hidden = {},
  footer,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  fields: Field[];
  submitLabel: string;
  hidden?: Record<string, string>;
  footer?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      {fields.map((f) => (
        <label key={f.name} className="flex flex-col gap-2">
          <span className="font-mono-tech text-xs tracking-[0.08em] text-[color:var(--color-text-muted)]">
            {f.label.toUpperCase()}
          </span>
          <input
            name={f.name}
            type={f.type}
            autoComplete={f.autoComplete}
            required
            className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-primary)] px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none transition-colors focus:border-[color:var(--color-accent-primary)]"
          />
          {f.hint ? (
            <span className="text-xs text-[color:var(--color-text-muted)]">{f.hint}</span>
          ) : null}
        </label>
      ))}

      {state.status === "error" ? (
        <p
          role="alert"
          className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-4 py-3 text-sm text-[color:var(--color-text-secondary)]"
        >
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p className="rounded-xl border border-[color:var(--color-accent-secondary)] bg-[color:var(--color-bg-elevated)] px-4 py-3 text-sm text-[color:var(--color-text-secondary)]">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[color:var(--color-accent-primary)] px-5 py-3 font-display text-sm font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {pending ? "Working…" : submitLabel}
      </button>

      {footer}
    </form>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-[color:var(--color-accent-secondary)] underline underline-offset-4"
    >
      {children}
    </Link>
  );
}
