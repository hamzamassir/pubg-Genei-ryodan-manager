"use client";

import { useMemo, useState, useTransition } from "react";
import { updateGameAction } from "@/app/actions";
import { maps, type GameMap } from "@/db/schema";

type RosterPlayer = {
  id: number;
  displayName: string;
  ingameName: string | null;
};

type GamePlayerRow = {
  userId: number;
  kills: number;
  assists: number;
};

type GameData = {
  id: number;
  gameNumber: number;
  map: GameMap;
  placement: number | null;
  notes: string | null;
  status: "completed" | "off";
  players: GamePlayerRow[];
};

export function GameEditor({
  game,
  roster,
}: {
  game: GameData;
  roster: RosterPlayer[];
}) {
  const [selected, setSelected] = useState<number[]>(
    game.players.map((p) => p.userId),
  );
  const [map, setMap] = useState<GameMap>(game.map);
  const [placement, setPlacement] = useState(
    game.placement != null ? String(game.placement) : "",
  );
  const [notes, setNotes] = useState(game.notes || "");
  const [stats, setStats] = useState<Record<number, { kills: number; assists: number }>>(
    () => {
      const init: Record<number, { kills: number; assists: number }> = {};
      for (const p of game.players) {
        init[p.userId] = { kills: p.kills, assists: p.assists };
      }
      return init;
    },
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const incomplete = selected.length < 3;

  const ordered = useMemo(
    () => roster.filter((r) => selected.includes(r.id)),
    [roster, selected],
  );

  function togglePlayer(id: number) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
    setStats((s) => ({
      ...s,
      [id]: s[id] || { kills: 0, assists: 0 },
    }));
  }

  return (
    <form
      className="panel-sharp space-y-4 p-4"
      action={(fd) => {
        start(async () => {
          setMsg(null);
          const res = await updateGameAction(fd);
          if (res?.error) setMsg(res.error);
          else setMsg("Saved");
        });
      }}
    >
      <input type="hidden" name="gameId" value={game.id} />
      {ordered.map((p) => (
        <span key={`hidden-${p.id}`}>
          <input type="hidden" name="playerId" value={p.id} />
          <input type="hidden" name="kills" value={stats[p.id]?.kills ?? 0} />
          <input type="hidden" name="assists" value={stats[p.id]?.assists ?? 0} />
        </span>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-black">Game {game.gameNumber}</h3>
        <span className={`badge ${game.status === "completed" ? "badge-acid" : "badge-off"}`}>
          {game.status === "completed" ? "COMPLETED" : "OFF / incomplete"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Map</label>
          <select
            name="map"
            className="select"
            value={map}
            onChange={(e) => setMap(e.target.value as GameMap)}
          >
            {maps.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Placement (#1–#16)</label>
          <input
            name="placement"
            className="input"
            type="number"
            min={1}
            max={16}
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            placeholder="e.g. 3"
          />
        </div>
      </div>

      <div>
        <label className="label">Players (3–4)</label>
        <div className="flex flex-wrap gap-2">
          {roster.map((p) => {
            const on = selected.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePlayer(p.id)}
                className={`min-h-11 border px-3 py-2 text-sm font-semibold ${
                  on
                    ? "border-[var(--venom)] text-[var(--venom)]"
                    : "border-[var(--border)] text-[var(--text-muted)]"
                }`}
              >
                {p.ingameName || p.displayName}
              </button>
            );
          })}
        </div>
        {incomplete && (
          <p className="mt-2 text-xs text-[var(--danger)]">
            &lt;3 players → marked OFF — does not count toward leaderboards.
          </p>
        )}
      </div>

      {ordered.length > 0 && (
        <div className="space-y-2">
          <div className="label">Kills / assists (from Discord report)</div>
          {ordered.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[1fr_72px_72px] items-center gap-2 border border-[var(--border)] p-2"
            >
              <span className="truncate text-base font-semibold">{p.ingameName || p.displayName}</span>
              <input
                className="input !py-1.5"
                type="number"
                min={0}
                value={stats[p.id]?.kills ?? 0}
                onChange={(e) =>
                  setStats((s) => ({
                    ...s,
                    [p.id]: {
                      kills: Number(e.target.value) || 0,
                      assists: s[p.id]?.assists ?? 0,
                    },
                  }))
                }
                aria-label={`${p.displayName} kills`}
              />
              <input
                className="input !py-1.5"
                type="number"
                min={0}
                value={stats[p.id]?.assists ?? 0}
                onChange={(e) =>
                  setStats((s) => ({
                    ...s,
                    [p.id]: {
                      kills: s[p.id]?.kills ?? 0,
                      assists: Number(e.target.value) || 0,
                    },
                  }))
                }
                aria-label={`${p.displayName} assists`}
              />
            </div>
          ))}
          <div className="grid grid-cols-[1fr_72px_72px] gap-2 px-2 text-[10px] tracking-wider text-[var(--text-muted)] uppercase font-[family-name:var(--font-hud)]">
            <span />
            <span className="text-center">K</span>
            <span className="text-center">A</span>
          </div>
        </div>
      )}

      <div>
        <label className="label">Notes</label>
        <textarea
          name="notes"
          className="textarea min-h-16"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Saving…" : "Save game"}
        </button>
        {msg && <span className="text-xs text-[var(--acid)]">{msg}</span>}
      </div>
    </form>
  );
}
