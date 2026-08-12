import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  games,
  gamePlayers,
  surveyResponses,
  surveys,
  matchDays,
  computeOverall,
  placementPoints,
  type SurveyQuestion,
} from "@/db/schema";

export type LeaderboardRow = {
  userId: number;
  displayName: string;
  ingameName: string | null;
  slot: string | null;
  role: string;
  gamesPlayed: number;
  totalKills: number;
  totalAssists: number;
  avgKills: number;
  avgAssists: number;
  avgPlacement: number | null;
  avgPlacementPts: number;
  peerAvg: number | null;
  overall: number;
};

export function getLeaderboard(): LeaderboardRow[] {
  const roster = db
    .select()
    .from(users)
    .where(sql`${users.role} IN ('player', 'manager')`)
    .all();

  const completed = db
    .select({
      userId: gamePlayers.userId,
      kills: gamePlayers.kills,
      assists: gamePlayers.assists,
      placement: games.placement,
      gameId: games.id,
    })
    .from(gamePlayers)
    .innerJoin(games, eq(gamePlayers.gameId, games.id))
    .where(eq(games.status, "completed"))
    .all();

  const peerMap = getPeerAverages();

  return roster
    .map((u) => {
      const rows = completed.filter((c) => c.userId === u.id);
      const gamesPlayed = rows.length;
      const totalKills = rows.reduce((s, r) => s + r.kills, 0);
      const totalAssists = rows.reduce((s, r) => s + r.assists, 0);
      const avgKills = gamesPlayed ? totalKills / gamesPlayed : 0;
      const avgAssists = gamesPlayed ? totalAssists / gamesPlayed : 0;
      const placements = rows
        .map((r) => r.placement)
        .filter((p): p is number => p != null);
      const avgPlacement =
        placements.length > 0
          ? placements.reduce((a, b) => a + b, 0) / placements.length
          : null;
      const avgPlacementPts =
        placements.length > 0
          ? placements.reduce((a, b) => a + placementPoints(b), 0) /
            placements.length
          : 0;
      const peerAvg = peerMap.get(u.id) ?? null;
      const overall = computeOverall({
        avgKills,
        avgAssists,
        avgPlacementPts,
        peerAvg,
      });

      return {
        userId: u.id,
        displayName: u.displayName,
        ingameName: u.ingameName,
        slot: u.slot,
        role: u.role,
        gamesPlayed,
        totalKills,
        totalAssists,
        avgKills: round2(avgKills),
        avgAssists: round2(avgAssists),
        avgPlacement: avgPlacement != null ? round2(avgPlacement) : null,
        avgPlacementPts: round2(avgPlacementPts),
        peerAvg: peerAvg != null ? round2(peerAvg) : null,
        overall: round2(overall),
      };
    })
    .sort((a, b) => b.overall - a.overall);
}

/** Average peer rating received across all peer_rating answers */
export function getPeerAverages(): Map<number, number> {
  const map = new Map<number, { sum: number; n: number }>();
  const responses = db.select().from(surveyResponses).all();
  const surveyList = db.select().from(surveys).all();
  const qBySurvey = new Map<number, SurveyQuestion[]>(
    surveyList.map((s) => {
      try {
        const parsed = JSON.parse(s.questionsJson) as unknown;
        // Role assessments store { engine: "..." } — not a question array
        return [s.id, Array.isArray(parsed) ? (parsed as SurveyQuestion[]) : []];
      } catch {
        return [s.id, []];
      }
    }),
  );

  for (const r of responses) {
    const questions = qBySurvey.get(r.surveyId) || [];
    if (!Array.isArray(questions) || questions.length === 0) continue;
    let answers: Record<string, unknown>;
    try {
      answers = JSON.parse(r.answersJson) as Record<string, unknown>;
    } catch {
      continue;
    }
    for (const q of questions) {
      if (!q || q.kind !== "peer_rating") continue;
      const ratings = answers[q.id] as Record<string, number> | undefined;
      if (!ratings || typeof ratings !== "object") continue;
      for (const [uidStr, score] of Object.entries(ratings)) {
        const uid = Number(uidStr);
        if (!Number.isFinite(uid) || typeof score !== "number") continue;
        const cur = map.get(uid) || { sum: 0, n: 0 };
        cur.sum += score;
        cur.n += 1;
        map.set(uid, cur);
      }
    }
  }

  const out = new Map<number, number>();
  for (const [uid, { sum, n }] of map) {
    if (n > 0) out.set(uid, sum / n);
  }
  return out;
}

export function getPendingSurveys(userId: number) {
  const answered = new Set(
    db
      .select()
      .from(surveyResponses)
      .where(eq(surveyResponses.respondentId, userId))
      .all()
      .map((r) => r.surveyId),
  );

  return db
    .select()
    .from(surveys)
    .where(eq(surveys.active, true))
    .all()
    .filter((s) => {
      if (answered.has(s.id)) return false;
      if (s.type === "onboarding") {
        const user = db.select().from(users).where(eq(users.id, userId)).get();
        return user && !user.onboardingDone;
      }
      return true;
    });
}

export function getRecentMatchDays(limit = 5) {
  return db
    .select()
    .from(matchDays)
    .orderBy(sql`${matchDays.playedAt} DESC`)
    .limit(limit)
    .all()
    .map((md) => {
      const mdGames = db
        .select()
        .from(games)
        .where(eq(games.matchDayId, md.id))
        .all();
      const completed = mdGames.filter((g) => g.status === "completed").length;
      return { ...md, gameCount: mdGames.length, completedCount: completed };
    });
}

export function getPlayerStats(userId: number) {
  const board = getLeaderboard();
  return board.find((r) => r.userId === userId) || null;
}

export function getMatchDayDetail(id: number) {
  const md = db.select().from(matchDays).where(eq(matchDays.id, id)).get();
  if (!md) return null;
  const mdGames = db
    .select()
    .from(games)
    .where(eq(games.matchDayId, id))
    .orderBy(games.gameNumber)
    .all()
    .map((g) => {
      const players = db
        .select({
          id: gamePlayers.id,
          userId: gamePlayers.userId,
          kills: gamePlayers.kills,
          assists: gamePlayers.assists,
          displayName: users.displayName,
          ingameName: users.ingameName,
        })
        .from(gamePlayers)
        .innerJoin(users, eq(gamePlayers.userId, users.id))
        .where(eq(gamePlayers.gameId, g.id))
        .all();
      return { ...g, players };
    });
  return { ...md, games: mdGames };
}

export function getRoster() {
  return db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      displayName: users.displayName,
      ingameName: users.ingameName,
      uid: users.uid,
      discord: users.discord,
      slot: users.slot,
    })
    .from(users)
    .where(sql`${users.role} IN ('player', 'manager')`)
    .orderBy(users.id)
    .all();
}

/** Teammates who shared at least one completed game with this user (anonymous peer pool). */
export function getTeammatesPlayedWith(userId: number) {
  const myCompletedGameIds = db
    .select({ gameId: gamePlayers.gameId })
    .from(gamePlayers)
    .innerJoin(games, eq(gamePlayers.gameId, games.id))
    .where(and(eq(gamePlayers.userId, userId), eq(games.status, "completed")))
    .all()
    .map((r) => r.gameId);

  if (myCompletedGameIds.length === 0) return [];

  const teammateIds = new Set<number>();
  for (const gameId of myCompletedGameIds) {
    const rows = db
      .select({ userId: gamePlayers.userId })
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId))
      .all();
    for (const r of rows) {
      if (r.userId !== userId) teammateIds.add(r.userId);
    }
  }

  return getRoster().filter((p) => teammateIds.has(p.id));
}

export function getAllUsersForAdmin() {
  return db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      displayName: users.displayName,
      ingameName: users.ingameName,
      uid: users.uid,
      discord: users.discord,
      slot: users.slot,
    })
    .from(users)
    .orderBy(users.id)
    .all();
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function refreshGameStatus(gameId: number) {
  const players = db
    .select()
    .from(gamePlayers)
    .where(eq(gamePlayers.gameId, gameId))
    .all();
  const game = db.select().from(games).where(eq(games.id, gameId)).get();
  if (!game) return;

  const status =
    players.length >= 3 && game.placement != null ? "completed" : "off";

  db.update(games)
    .set({ status })
    .where(and(eq(games.id, gameId)))
    .run();
}
