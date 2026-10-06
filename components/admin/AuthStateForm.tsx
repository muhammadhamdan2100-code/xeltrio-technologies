"use client";

import { useActionState, type ReactNode } from "react";

type State = { status: "idle" | "error" | "success"; message?: string };

/**
 * Shared admin form wrapper: wires a Server Action to useActionState and renders
 * the pending / error / success states. Fields stay plain HTML inputs so the
 * server remains the only place authorization and validation happen.
 */
export function AuthStateForm({
  action,
  idle,
  submitLabel,
  columns = "sm:grid-cols-2",
  children,
  confirm,
}: {
  action: (prev: State, form: FormData) => Promise<State>;
  idle: State;
  submitLabel: string;
  columns?: string;
  children: ReactNode;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, idle);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <div className={`grid gap-3 ${columns}`}>{children}</div>

      {confirm ? (
        <p className="text-xs text-[color:var(--color-text-muted)]">
          Destructive action — type <span className="font-mono-tech">{confirm}</span> to confirm.
        </p>
      ) : null}

      {state.status === "error" ? (
        <p role="alert" className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-primary)] px-3 py-2 text-sm text-[color:var(--color-text-secondary)]">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p className="rounded-xl border border-[color:var(--color-accent-secondary)] px-3 py-2 text-sm text-[color:var(--color-text-secondary)]">
          {state.message}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[color:var(--color-accent-primary)] px-5 py-2.5 font-display text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
