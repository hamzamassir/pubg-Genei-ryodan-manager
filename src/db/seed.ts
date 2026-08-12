import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, sqlite } from "./index";
import {
  users,
  surveys,
  matchDays,
  games,
  gamePlayers,
  type SurveyQuestion,
} from "./schema";
import { loadCredentials } from "@/lib/credentials";

const ROSTER = [
  {
    username: "oba",
    role: "manager" as const,
    displayName: "OBA",
    ingameName: "GENEIxOBA",
    uid: "5179784184",
    discord: "@oba0818",
    slot: "P1 / Manager",
  },
  {
    username: "tonik",
    role: "player" as const,
    displayName: "TONIK",
    ingameName: "GENEIxTONIK",
    uid: "5290164280",
    discord: "@tonik120833",
    slot: "P2",
  },
  {
    username: "nabil",
    role: "player" as const,
    displayName: "NABIL",
    ingameName: "GENEIxNABIL",
    uid: "5272839576",
    discord: "@miticonabil",
    slot: "P3",
  },
  {
    username: "zed",
    role: "player" as const,
    displayName: "ZED",
    ingameName: "GENEIxZED",
    uid: "5595659826",
    discord: "@zed062534",
    slot: "P4",
  },
  {
    username: "ice",
    role: "player" as const,
    displayName: "ICE",
    ingameName: "GENEIxICE",
    uid: "51739825140",
    discord: "@l3azwa",
    slot: "P5",
  },
  {
    username: "ninja",
    role: "player" as const,
    displayName: "NINJA",
    ingameName: "GENEIxNINJA",
    uid: "560936336",
    discord: "@ninjanba",
    slot: "P6",
  },
];

const ADMIN = {
  username: "admin",
  role: "admin" as const,
  displayName: "Dashboard Admin",
  ingameName: null as string | null,
  uid: null as string | null,
  discord: null as string | null,
  slot: "ADMIN",
};

function migrate() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'player',
      display_name TEXT NOT NULL,
      ingame_name TEXT,
      uid TEXT,
      discord TEXT,
      slot TEXT,
      onboarding_done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS match_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      played_at TEXT NOT NULL,
      title TEXT NOT NULL,
      planned_games INTEGER NOT NULL DEFAULT 3,
      notes TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_day_id INTEGER NOT NULL REFERENCES match_days(id) ON DELETE CASCADE,
      game_number INTEGER NOT NULL,
      map TEXT NOT NULL,
      placement INTEGER,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'off',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      kills INTEGER NOT NULL DEFAULT 0,
      assists INTEGER NOT NULL DEFAULT 0
    );
    CREATE UNIQUE INDEX IF NOT EXISTS game_player_unique ON game_players(game_id, user_id);

    CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      questions_json TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS survey_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
      respondent_id INTEGER NOT NULL REFERENCES users(id),
      answers_json TEXT NOT NULL,
      scores_json TEXT,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS survey_response_unique ON survey_responses(survey_id, respondent_id);
  `);

  // Rename legacy whatsapp column → discord
  const cols = sqlite.prepare("PRAGMA table_info(users)").all() as {
    name: string;
  }[];
  const names = new Set(cols.map((c) => c.name));
  if (names.has("whatsapp") && !names.has("discord")) {
    sqlite.exec("ALTER TABLE users RENAME COLUMN whatsapp TO discord");
  } else if (!names.has("discord")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN discord TEXT");
  }

  const respCols = sqlite.prepare("PRAGMA table_info(survey_responses)").all() as {
    name: string;
  }[];
  if (!respCols.some((c) => c.name === "scores_json")) {
    sqlite.exec("ALTER TABLE survey_responses ADD COLUMN scores_json TEXT");
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS question_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      reason TEXT NOT NULL DEFAULT 'unclear',
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS question_flag_unique
      ON question_flags(survey_id, question_id, user_id);

    CREATE TABLE IF NOT EXISTS magic_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      created_by INTEGER NOT NULL REFERENCES users(id),
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

export function ensureDb() {
  migrate();
  // Parallel Next.js build workers race on first insert — seed only at runtime.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  seedIfEmpty();
  patchOnboardingCopy();
}

/** Keep onboarding survey copy current without wiping player data */
function patchOnboardingCopy() {
  const onboarding = db
    .select()
    .from(surveys)
    .where(eq(surveys.type, "onboarding"))
    .get();
  if (!onboarding) return;

  const questions: SurveyQuestion[] = [
    {
      id: "peer_comm",
      prompt: "Anonymous — rate communication of teammates you played with (1–10)",
      kind: "peer_rating",
      min: 1,
      max: 10,
    },
    {
      id: "peer_skill",
      prompt: "Anonymous — rate aim / game sense of teammates you played with (1–10)",
      kind: "peer_rating",
      min: 1,
      max: 10,
    },
    {
      id: "peer_trust",
      prompt: "Anonymous — rate trust in fight for teammates you played with (1–10)",
      kind: "peer_rating",
      min: 1,
      max: 10,
    },
  ];

  db.update(surveys)
    .set({
      description:
        "Rate only teammates you have played completed games with. Ratings are anonymous — nobody sees who rated whom. Results feed peer ranking.",
      questionsJson: JSON.stringify(questions),
    })
    .where(eq(surveys.id, onboarding.id))
    .run();
}

function seedIfEmpty() {
  const count = sqlite.prepare("SELECT COUNT(*) as c FROM users").get() as {
    c: number;
  };
  if (count.c > 0) {
    syncPasswords();
    return;
  }

  try {
    sqlite.exec("BEGIN IMMEDIATE");
    const again = sqlite.prepare("SELECT COUNT(*) as c FROM users").get() as {
      c: number;
    };
    if (again.c > 0) {
      sqlite.exec("COMMIT");
      syncPasswords();
      return;
    }
    runSeed();
    sqlite.exec("COMMIT");
  } catch (err) {
    try {
      sqlite.exec("ROLLBACK");
    } catch {
      /* ignore */
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE") || msg.includes("busy")) {
      syncPasswords();
      return;
    }
    throw err;
  }
}

function runSeed() {
  const creds = loadCredentials();
  const now = new Date().toISOString();

  const adminPass = creds.get("admin");
  if (!adminPass) {
    throw new Error("credentials.local.txt must include admin=...");
  }

  const adminId = db
    .insert(users)
    .values({
      username: ADMIN.username,
      passwordHash: bcrypt.hashSync(adminPass, 10),
      role: ADMIN.role,
      displayName: ADMIN.displayName,
      ingameName: ADMIN.ingameName,
      uid: ADMIN.uid,
      discord: ADMIN.discord,
      slot: ADMIN.slot,
      onboardingDone: true,
      createdAt: now,
    })
    .returning({ id: users.id })
    .get().id;

  for (const p of ROSTER) {
    const pass = creds.get(p.username);
    if (!pass) {
      throw new Error(`credentials.local.txt must include ${p.username}=...`);
    }
    db.insert(users)
      .values({
        username: p.username,
        passwordHash: bcrypt.hashSync(pass, 10),
        role: p.role,
        displayName: p.displayName,
        ingameName: p.ingameName,
        uid: p.uid,
        discord: p.discord,
        slot: p.slot,
        onboardingDone: false,
        createdAt: now,
      })
      .run();
  }

  const onboardingQuestions: SurveyQuestion[] = [
    {
      id: "peer_comm",
      prompt: "Anonymous — rate communication of teammates you played with (1–10)",
      kind: "peer_rating",
      min: 1,
      max: 10,
    },
    {
      id: "peer_skill",
      prompt: "Anonymous — rate aim / game sense of teammates you played with (1–10)",
      kind: "peer_rating",
      min: 1,
      max: 10,
    },
    {
      id: "peer_trust",
      prompt: "Anonymous — rate trust in fight for teammates you played with (1–10)",
      kind: "peer_rating",
      min: 1,
      max: 10,
    },
  ];

  db.insert(surveys)
    .values({
      type: "onboarding",
      title: "GENEx Onboarding Peer Rating",
      description:
        "Rate only teammates you have played completed games with. Ratings are anonymous — nobody sees who rated whom. Results feed peer ranking.",
      questionsJson: JSON.stringify(onboardingQuestions),
      active: true,
      createdBy: adminId,
      createdAt: now,
    })
    .run();

  const md = db
    .insert(matchDays)
    .values({
      playedAt: new Date().toISOString(),
      title: "Scrim — Welcome Day",
      plannedGames: 3,
      notes: "Seed sample. Replace with real match logs.",
      createdBy: adminId,
      createdAt: now,
    })
    .returning()
    .get();

  const rosterUsers = db
    .select()
    .from(users)
    .where(eq(users.role, "player"))
    .all();
  const manager = db.select().from(users).where(eq(users.role, "manager")).get();
  const squad = [...(manager ? [manager] : []), ...rosterUsers].slice(0, 4);

  const sampleGames = [
    { map: "Erangel" as const, placement: 2, kills: [4, 3, 2, 1], assists: [2, 1, 3, 0] },
    { map: "Miramar" as const, placement: 5, kills: [2, 5, 1, 3], assists: [1, 2, 1, 2] },
    { map: "Rondo" as const, placement: 1, kills: [6, 2, 4, 3], assists: [3, 2, 1, 2] },
  ];

  sampleGames.forEach((g, i) => {
    const game = db
      .insert(games)
      .values({
        matchDayId: md.id,
        gameNumber: i + 1,
        map: g.map,
        placement: g.placement,
        notes: null,
        status: "completed",
        createdAt: now,
      })
      .returning()
      .get();

    squad.forEach((u, idx) => {
      db.insert(gamePlayers)
        .values({
          gameId: game.id,
          userId: u.id,
          kills: g.kills[idx] ?? 0,
          assists: g.assists[idx] ?? 0,
        })
        .run();
    });
  });

  console.log("[seed] GENEx roster + admin + onboarding survey + sample scrim ready");
}

function syncPasswords() {
  try {
    const creds = loadCredentials();
    for (const [username, password] of creds) {
      const user = db.select().from(users).where(eq(users.username, username)).get();
      if (!user) continue;
      if (bcrypt.compareSync(password, user.passwordHash)) continue;
      const hash = bcrypt.hashSync(password, 10);
      db.update(users).set({ passwordHash: hash }).where(eq(users.id, user.id)).run();
    }
  } catch {
    // credentials missing during build — ignore
  }
}

export { ROSTER, ADMIN };
