import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { GameEditor } from "@/components/GameEditor";
import { DeleteMatchDayButton } from "@/components/DeleteMatchDayButton";
import { getSession } from "@/lib/auth";
import { getMatchDayDetail, getRoster } from "@/lib/stats";

export default async function MatchDayDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/home");

  const { id } = await params;
  const detail = getMatchDayDetail(Number(id));
  if (!detail) notFound();
  const roster = getRoster();

  return (
    <AppShell user={session}>
      <div className="animate-in space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href="/admin/match-days" className="text-sm font-semibold text-[var(--text-muted)]">
              ← Match days
            </Link>
            <h1 className="page-title mt-1">{detail.title}</h1>
            <p className="text-base text-[var(--text-muted)]">
              {format(new Date(detail.playedAt), "dd MMM yyyy HH:mm")} ·{" "}
              {detail.plannedGames} games planned
            </p>
            {detail.notes && (
              <p className="mt-2 text-base text-[var(--text-muted)]">{detail.notes}</p>
            )}
          </div>
          <DeleteMatchDayButton matchDayId={detail.id} title={detail.title} />
        </div>

        <div className="space-y-4">
          {detail.games.map((g) => (
            <GameEditor
              key={g.id}
              game={{
                id: g.id,
                gameNumber: g.gameNumber,
                map: g.map,
                placement: g.placement,
                notes: g.notes,
                status: g.status,
                players: g.players.map((p) => ({
                  userId: p.userId,
                  kills: p.kills,
                  assists: p.assists,
                })),
              }}
              roster={roster.map((r) => ({
                id: r.id,
                displayName: r.displayName,
                ingameName: r.ingameName,
              }))}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
