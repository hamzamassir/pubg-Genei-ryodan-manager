import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { getRoster } from "@/lib/stats";

export default async function RosterPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const roster = getRoster();

  return (
    <AppShell user={session}>
      <div className="animate-in space-y-4">
        <div>
          <h1 className="page-title">GENEx Roster</h1>
          <p className="mt-1 text-base text-[var(--text-muted)]">
            Team Manager (OBA) is not the dashboard admin.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {roster.map((p) => (
            <article key={p.id} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-extrabold tracking-wide">
                    {p.ingameName}
                  </div>
                  <div className="text-base text-[var(--text-muted)]">{p.displayName}</div>
                </div>
                <span className={`badge ${p.role === "manager" ? "badge-acid" : ""}`}>
                  {p.slot}
                </span>
              </div>
              <dl className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
                <div className="flex justify-between gap-2">
                  <dt>UID</dt>
                  <dd className="font-semibold text-[var(--text)]">{p.uid}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Discord</dt>
                  <dd className="font-semibold text-[var(--text)]">{p.discord}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Login</dt>
                  <dd className="font-semibold text-[var(--venom)]">{p.username}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Role</dt>
                  <dd className="font-semibold uppercase text-[var(--text)]">{p.role}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
