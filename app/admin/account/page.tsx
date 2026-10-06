import { requireAuth } from "@/lib/authz/guards";
import { AuthForm } from "@/components/auth/AuthForm";
import { updateProfileAction } from "@/app/auth/actions";
import { ROLE_LABELS } from "@/lib/authz/permissions";

export default async function AdminAccountPage() {
  const principal = await requireAuth();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
          Your account
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          You can change your own name and avatar. Role, status and privileged metadata are not sent by
          this form and the database rejects them if forged — an administrator must make those changes.
        </p>
      </div>

      <div className="max-w-[520px] rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6 sm:p-8">
        <dl className="mb-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">ROLE</dt>
            <dd className="mt-1 text-[color:var(--color-text-secondary)]">
              {ROLE_LABELS[principal.role]}
            </dd>
          </div>
          <div>
            <dt className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">STATUS</dt>
            <dd className="mt-1 text-[color:var(--color-text-secondary)]">{principal.status}</dd>
          </div>
        </dl>

        <AuthForm
          action={updateProfileAction}
          submitLabel="Save changes"
          fields={[
            { name: "full_name", label: "Full name", type: "text", autoComplete: "name" },
            {
              name: "avatar_url",
              label: "Avatar URL",
              type: "url",
              autoComplete: "photo",
              hint: "HTTPS URL or leave empty.",
            },
          ]}
        />
      </div>
    </div>
  );
}
