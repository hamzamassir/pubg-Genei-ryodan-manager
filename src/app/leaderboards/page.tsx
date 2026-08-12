import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { LeaderboardClient } from "@/components/LeaderboardClient";
import { getSession } from "@/lib/auth";
import { getLeaderboard } from "@/lib/stats";

export default async function LeaderboardsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = getLeaderboard();

  return (
    <AppShell user={session}>
      <div className="animate-in space-y-4">
        <div>
          <h1 className="text-2xl font-black tracking-wide">Leaderboards</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Completed games only (≥3 players + scores). OFF games excluded.
          </p>
        </div>
        <LeaderboardClient rows={rows} />
      </div>
    </AppShell>
  );
}
