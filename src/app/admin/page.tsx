import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { getRecentMatchDays, getLeaderboard } from "@/lib/stats";
import { db } from "@/db";
import { surveys } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/home");

  const recent = getRecentMatchDays(6);
  const board = getLeaderboard().slice(0, 3);
  const activeSurveys = db
    .select()
    .from(surveys)
    .where(eq(surveys.active, true))
    .all();

  return (
    <AppShell user={session}>
      <div className="animate-in space-y-6">
        <section className="panel p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="glow-dot" />
            <span className="font-[family-name:var(--font-hud)] text-[10px] tracking-[0.25em] text-[var(--acid)] uppercase">
              Admin nest
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-wide sm:text-3xl">
            Match-day command
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
            Log Discord scrim reports here. Team Manager (OBA) is a roster role — not this
            account.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/admin/match-days/new" className="btn">
              New match day
            </Link>
            <Link href="/admin/match-days" className="btn btn-ghost">
              All match days
            </Link>
            <Link href="/admin/users" className="btn btn-ghost">
              Users / passwords
            </Link>
            <Link href="/admin/surveys" className="btn btn-acid">
              Surveys
            </Link>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="panel p-5">
            <h2 className="font-[family-name:var(--font-hud)] text-xs tracking-[0.2em] uppercase">
              Recent match days
            </h2>
            <ul className="mt-3 space-y-3">
              {recent.map((md) => (
                <li key={md.id} className="flex items-center justify-between gap-2">
                  <div>
                    <Link
                      href={`/admin/match-days/${md.id}`}
                      className="font-semibold hover:text-[var(--venom)]"
                    >
                      {md.title}
                    </Link>
                    <div className="text-xs text-[var(--text-muted)]">
                      {format(new Date(md.playedAt), "dd MMM yyyy HH:mm")}
                    </div>
                  </div>
                  <span className="badge">
                    {md.completedCount}/{md.gameCount}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-5">
            <h2 className="font-[family-name:var(--font-hud)] text-xs tracking-[0.2em] uppercase">
              Top overall
            </h2>
            <ol className="mt-3 space-y-2">
              {board.map((r, i) => (
                <li key={r.userId} className="flex justify-between text-sm">
                  <span>
                    <span className="mr-2 text-[var(--venom)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {r.ingameName || r.displayName}
                  </span>
                  <span className="font-black">{r.overall}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              Active surveys: {activeSurveys.length}
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
