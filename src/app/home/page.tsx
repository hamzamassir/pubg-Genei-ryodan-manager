import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import {
  getPendingSurveys,
  getPlayerStats,
  getRecentMatchDays,
} from "@/lib/stats";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ survey?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const sp = await searchParams;
  const pending = getPendingSurveys(session.id);
  const stats = getPlayerStats(session.id);
  const recent = getRecentMatchDays(4);

  return (
    <AppShell user={session}>
      <div className="animate-in space-y-5">
        {sp.survey === "done" && (
          <div className="panel-sharp border-[var(--acid)] p-4 text-base text-[var(--acid)]">
            Survey submitted. Results stay with admin only.
          </div>
        )}

        <section className="panel p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="glow-dot" />
                <span className="section-label text-[var(--acid)]">Live nest</span>
              </div>
              <h1 className="page-title mt-2">
                {session.ingameName || session.displayName}
              </h1>
              <p className="mt-1 text-base text-[var(--text-muted)]">
                Welcome back, {session.displayName}
                {session.role === "manager" ? " · Team Manager" : ""}
              </p>
            </div>
            <span className="badge">{session.role}</span>
          </div>
        </section>

        {pending.length > 0 && (
          <section className="panel-sharp border-[var(--venom)] p-4">
            <h2 className="section-label">Pending surveys</h2>
            <ul className="mt-3 space-y-3">
              {pending.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">{s.title}</div>
                    <div className="text-sm text-[var(--text-muted)]">
                      {s.type === "role_assessment"
                        ? "Weekly role assessment · tap Next"
                        : `${s.type} · anonymous peers`}
                    </div>
                  </div>
                  <Link href={`/surveys/${s.id}`} className="btn btn-acid shrink-0 text-sm">
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Games", value: stats?.gamesPlayed ?? 0 },
            { label: "Kills", value: stats?.totalKills ?? 0 },
            { label: "Assists", value: stats?.totalAssists ?? 0 },
            { label: "Overall", value: stats?.overall ?? 0 },
          ].map((s) => (
            <div key={s.label} className="panel-sharp p-4">
              <div className="label mb-1">{s.label}</div>
              <div className="text-2xl font-extrabold text-[var(--venom)]">{s.value}</div>
            </div>
          ))}
        </section>

        <section className="panel p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="section-label">Recent match days</h2>
            <Link href="/leaderboards" className="text-sm font-semibold text-[var(--venom)]">
              Ranks →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-base text-[var(--text-muted)]">No scrims logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((md) => (
                <li
                  key={md.id}
                  className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">{md.title}</div>
                    <div className="text-sm text-[var(--text-muted)]">
                      {format(new Date(md.playedAt), "dd MMM yyyy HH:mm")}
                    </div>
                  </div>
                  <span className="badge badge-acid shrink-0">
                    {md.completedCount}/{md.gameCount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
