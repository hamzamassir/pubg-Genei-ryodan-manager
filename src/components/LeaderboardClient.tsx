"use client";

import { useMemo, useState } from "react";
import type { LeaderboardRow } from "@/lib/stats";
import { OVERALL_FORMULA } from "@/db/schema";

type Tab =
  | "overall"
  | "played"
  | "kills"
  | "avgKills"
  | "assists"
  | "avgAssists"
  | "peer";

const TABS: { id: Tab; label: string }[] = [
  { id: "overall", label: "Overall" },
  { id: "played", label: "Played" },
  { id: "kills", label: "Kills" },
  { id: "avgKills", label: "Avg K" },
  { id: "assists", label: "Assists" },
  { id: "avgAssists", label: "Avg A" },
  { id: "peer", label: "Peer" },
];

function valueFor(row: LeaderboardRow, tab: Tab): number {
  switch (tab) {
    case "overall":
      return row.overall;
    case "played":
      return row.gamesPlayed;
    case "kills":
      return row.totalKills;
    case "avgKills":
      return row.avgKills;
    case "assists":
      return row.totalAssists;
    case "avgAssists":
      return row.avgAssists;
    case "peer":
      return row.peerAvg ?? -1;
  }
}

export function LeaderboardClient({ rows }: { rows: LeaderboardRow[] }) {
  const [tab, setTab] = useState<Tab>("overall");

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => valueFor(b, tab) - valueFor(a, tab));
  }, [rows, tab]);

  return (
    <div className="space-y-4">
      <div className="panel-sharp space-y-2 p-4 text-base text-[var(--text-muted)]">
        <div className="section-label">Overall formula</div>
        <p className="text-[var(--text)]">{OVERALL_FORMULA.label}</p>
        <p className="text-sm leading-relaxed">{OVERALL_FORMULA.detail}</p>
        <p className="text-sm leading-relaxed">
          Peer scores are <span className="font-semibold text-[var(--acid)]">anonymous averages</span>{" "}
          from teammates who shared completed games — individual raters are never shown.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-11 shrink-0 border px-3 py-2 text-sm font-bold ${
              tab === t.id
                ? "border-[var(--venom)] bg-[rgba(168,85,247,0.12)] text-[var(--venom)]"
                : "border-[var(--border)] text-[var(--text-muted)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-left text-base">
          <thead className="border-b border-[var(--border)] bg-[rgba(0,0,0,0.35)] text-sm text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-3">#</th>
              <th className="px-3 py-3">Player</th>
              <th className="px-3 py-3 text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.userId} className="border-b border-[var(--border)] last:border-0">
                <td className="px-3 py-3 font-bold text-[var(--venom)]">
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td className="px-3 py-3">
                  <div className="font-semibold">{r.ingameName || r.displayName}</div>
                  <div className="text-sm text-[var(--text-muted)]">
                    {r.displayName}
                    {r.role === "manager" ? " · MGR" : ""} · {r.slot}
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-xl font-extrabold">
                  {tab === "peer" && r.peerAvg == null ? "—" : valueFor(r, tab)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
