import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { getRecentMatchDays } from "@/lib/stats";

export default async function MatchDaysListPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/home");

  const days = getRecentMatchDays(50);

  return (
    <AppShell user={session}>
      <div className="animate-in space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">Match days</h1>
            <p className="text-base text-[var(--text-muted)]">Scrim sessions logged from Discord reports</p>
          </div>
          <Link href="/admin/match-days/new" className="btn">
            New match day
          </Link>
        </div>
        <div className="panel overflow-hidden">
          <ul>
            {days.map((md) => (
              <li
                key={md.id}
                className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0"
              >
                <div>
                  <Link
                    href={`/admin/match-days/${md.id}`}
                    className="font-semibold hover:text-[var(--venom)]"
                  >
                    {md.title}
                  </Link>
                  <div className="text-xs text-[var(--text-muted)]">
                    {format(new Date(md.playedAt), "dd MMM yyyy HH:mm")} · planned{" "}
                    {md.plannedGames}
                  </div>
                </div>
                <span
                  className={`badge ${md.completedCount > 0 ? "badge-acid" : "badge-off"}`}
                >
                  {md.completedCount}/{md.gameCount} completed
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
