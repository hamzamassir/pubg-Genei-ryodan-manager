import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

export const roles = ["admin", "manager", "player"] as const;
export type Role = (typeof roles)[number];

export const maps = ["Erangel", "Miramar", "Rondo"] as const;
export type GameMap = (typeof maps)[number];

export const gameStatuses = ["completed", "off"] as const;
export type GameStatus = (typeof gameStatuses)[number];

export const surveyTypes = ["onboarding", "admin", "role_assessment"] as const;
export type SurveyType = (typeof surveyTypes)[number];

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<Role>().notNull().default("player"),
  displayName: text("display_name").notNull(),
  ingameName: text("ingame_name"),
  uid: text("uid"),
  /** Discord handle, e.g. @oba0818 */
  discord: text("discord"),
  slot: text("slot"),
  onboardingDone: integer("onboarding_done", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const matchDays = sqliteTable("match_days", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playedAt: text("played_at").notNull(),
  title: text("title").notNull(),
  plannedGames: integer("planned_games").notNull().default(3),
  notes: text("notes"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchDayId: integer("match_day_id")
    .notNull()
    .references(() => matchDays.id, { onDelete: "cascade" }),
  gameNumber: integer("game_number").notNull(),
  map: text("map").$type<GameMap>().notNull(),
  placement: integer("placement"),
  notes: text("notes"),
  status: text("status").$type<GameStatus>().notNull().default("off"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const gamePlayers = sqliteTable(
  "game_players",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    kills: integer("kills").notNull().default(0),
    assists: integer("assists").notNull().default(0),
  },
  (t) => [uniqueIndex("game_player_unique").on(t.gameId, t.userId)],
);

export const surveys = sqliteTable("surveys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").$type<SurveyType>().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  /** JSON: { id, prompt, kind: 'peer_rating' | 'scale' | 'text', options? }[] */
  questionsJson: text("questions_json").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const surveyResponses = sqliteTable(
  "survey_responses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    surveyId: integer("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    respondentId: integer("respondent_id")
      .notNull()
      .references(() => users.id),
    /** JSON answers keyed by question id */
    answersJson: text("answers_json").notNull(),
    /** Role assessment computed scores (JSON) — never expose peer raters */
    scoresJson: text("scores_json"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [uniqueIndex("survey_response_unique").on(t.surveyId, t.respondentId)],
);

export const questionFlags = sqliteTable(
  "question_flags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    surveyId: integer("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    reason: text("reason").notNull().default("unclear"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [uniqueIndex("question_flag_unique").on(t.surveyId, t.questionId, t.userId)],
);

/** One-time magic links for password setup / reset (admin-issued) */
export const magicLinks = sqliteTable("magic_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/** In-progress survey answers (auto-save) — survives refresh */
export const surveyDrafts = sqliteTable(
  "survey_drafts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    surveyId: integer("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    answersJson: text("answers_json").notNull().default("{}"),
    unclearJson: text("unclear_json").notNull().default("[]"),
    step: integer("step").notNull().default(0),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [uniqueIndex("survey_draft_unique").on(t.surveyId, t.userId)],
);

export type User = typeof users.$inferSelect;
export type MatchDay = typeof matchDays.$inferSelect;
export type Game = typeof games.$inferSelect;
export type GamePlayer = typeof gamePlayers.$inferSelect;
export type Survey = typeof surveys.$inferSelect;
export type SurveyResponse = typeof surveyResponses.$inferSelect;

export type SurveyQuestion = {
  id: string;
  prompt: string;
  kind: "peer_rating" | "scale" | "text";
  min?: number;
  max?: number;
};

/** Overall score formula weights — shown in UI */
export const OVERALL_FORMULA = {
  label: "Overall = (avg kills × 3) + (avg assists × 1.5) + (placement pts × 2) + peer (1–10)",
  detail:
    "Placement pts = average of (17 − finish). Peer = anonymous teammate rating average (1–10). Only completed games (≥3 players with scores) count.",
} as const;

export function placementPoints(placement: number | null | undefined): number {
  if (placement == null || placement < 1 || placement > 16) return 0;
  return 17 - placement;
}

export function computeOverall(input: {
  avgKills: number;
  avgAssists: number;
  avgPlacementPts: number;
  peerAvg: number | null;
}): number {
  const peer = input.peerAvg ?? 0;
  return (
    input.avgKills * 3 +
    input.avgAssists * 1.5 +
    input.avgPlacementPts * 2 +
    peer
  );
}
