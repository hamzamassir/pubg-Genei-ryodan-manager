"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ensureDb } from "@/db/seed";
import {
  users,
  matchDays,
  games,
  gamePlayers,
  surveys,
  surveyResponses,
  questionFlags,
  magicLinks,
  surveyDrafts,
  type GameMap,
  type SurveyQuestion,
} from "@/db/schema";
import { createSession, destroySession, requireAdmin, requireUser } from "@/lib/auth";
import { getTeammatesPlayedWith, refreshGameStatus } from "@/lib/stats";
import {
  createRawMagicToken,
  hashMagicToken,
  magicLinkExpiresAt,
} from "@/lib/magic-link";
import { headers } from "next/headers";

ensureDb();

export async function loginAction(formData: FormData): Promise<{ error: string } | void> {
  ensureDb();
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  const user = db.select().from(users).where(eq(users.username, username)).get();
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return { error: "Invalid username or password" };
  }

  await createSession(user);

  if (user.role !== "admin" && !user.onboardingDone) {
    const onboarding = db
      .select()
      .from(surveys)
      .where(eq(surveys.type, "onboarding"))
      .get();
    if (onboarding) redirect(`/surveys/${onboarding.id}`);
  }

  redirect(user.role === "admin" ? "/admin" : "/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function createMatchDayAction(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") || "Scrim").trim();
  const playedAt = String(formData.get("playedAt") || new Date().toISOString());
  const plannedGames = Math.min(
    5,
    Math.max(3, Number(formData.get("plannedGames") || 3)),
  );
  const notes = String(formData.get("notes") || "").trim() || null;

  const md = db
    .insert(matchDays)
    .values({
      title,
      playedAt: new Date(playedAt).toISOString(),
      plannedGames,
      notes,
      createdBy: admin.id,
      createdAt: new Date().toISOString(),
    })
    .returning()
    .get();

  for (let i = 1; i <= plannedGames; i++) {
    db.insert(games)
      .values({
        matchDayId: md.id,
        gameNumber: i,
        map: "Erangel",
        placement: null,
        notes: null,
        status: "off",
        createdAt: new Date().toISOString(),
      })
      .run();
  }

  revalidatePath("/admin");
  revalidatePath("/admin/match-days");
  redirect(`/admin/match-days/${md.id}`);
}

export async function updateGameAction(formData: FormData) {
  await requireAdmin();
  const gameId = Number(formData.get("gameId"));
  const map = String(formData.get("map")) as GameMap;
  const placementRaw = formData.get("placement");
  const placement =
    placementRaw === "" || placementRaw == null
      ? null
      : Number(placementRaw);
  const notes = String(formData.get("notes") || "").trim() || null;
  const playerIds = formData.getAll("playerId").map(Number);
  const kills = formData.getAll("kills").map((v) => Number(v) || 0);
  const assists = formData.getAll("assists").map((v) => Number(v) || 0);

  if (!gameId) return { error: "Missing game" };

  db.update(games)
    .set({
      map,
      placement:
        placement != null && placement >= 1 && placement <= 16
          ? placement
          : null,
      notes,
    })
    .where(eq(games.id, gameId))
    .run();

  db.delete(gamePlayers).where(eq(gamePlayers.gameId, gameId)).run();

  playerIds.forEach((userId, idx) => {
    if (!userId) return;
    db.insert(gamePlayers)
      .values({
        gameId,
        userId,
        kills: kills[idx] ?? 0,
        assists: assists[idx] ?? 0,
      })
      .run();
  });

  refreshGameStatus(gameId);

  const game = db.select().from(games).where(eq(games.id, gameId)).get();
  revalidatePath(`/admin/match-days/${game?.matchDayId}`);
  revalidatePath("/");
  revalidatePath("/leaderboards");
  return { ok: true };
}

export async function deleteMatchDayAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("matchDayId"));
  if (!id) return { error: "Missing match day" };

  const mdGames = db.select().from(games).where(eq(games.matchDayId, id)).all();
  for (const g of mdGames) {
    db.delete(gamePlayers).where(eq(gamePlayers.gameId, g.id)).run();
  }
  db.delete(games).where(eq(games.matchDayId, id)).run();
  db.delete(matchDays).where(eq(matchDays.id, id)).run();

  revalidatePath("/admin");
  revalidatePath("/admin/match-days");
  revalidatePath("/");
  revalidatePath("/leaderboards");
  redirect("/admin/match-days");
}

export async function updateUserAction(
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  await requireAdmin();
  const userId = Number(formData.get("userId"));
  if (!userId) return { error: "Missing user" };

  const displayName = String(formData.get("displayName") || "").trim();
  const ingameName = String(formData.get("ingameName") || "").trim() || null;
  const discord = String(formData.get("discord") || "").trim() || null;
  const uid = String(formData.get("uid") || "").trim() || null;
  const slot = String(formData.get("slot") || "").trim() || null;
  const newPassword = String(formData.get("password") || "");

  if (!displayName) return { error: "Display name required" };

  const patch: {
    displayName: string;
    ingameName: string | null;
    discord: string | null;
    uid: string | null;
    slot: string | null;
    passwordHash?: string;
  } = { displayName, ingameName, discord, uid, slot };

  if (newPassword.length > 0) {
    if (newPassword.length < 6) return { error: "Password must be at least 6 characters" };
    patch.passwordHash = bcrypt.hashSync(newPassword, 10);
  }

  db.update(users).set(patch).where(eq(users.id, userId)).run();
  revalidatePath("/admin/users");
  revalidatePath("/roster");
  return { ok: true };
}

async function appOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3040";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return process.env.APP_ORIGIN || `${proto}://${host}`;
}

/** Admin: create one-time magic link for password setup / reset */
export async function generateMagicLinkAction(
  formData: FormData,
): Promise<{ error?: string; url?: string; expiresAt?: string }> {
  const admin = await requireAdmin();
  const userId = Number(formData.get("userId"));
  if (!userId) return { error: "Missing user" };

  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return { error: "User not found" };
  if (user.role === "admin" && user.id !== admin.id) {
    // allow admin to reset own via magic link; don't block other admins if any
  }

  // Invalidate unused previous links for this user
  const existing = db
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.userId, userId))
    .all();
  for (const link of existing) {
    if (!link.usedAt) {
      db.update(magicLinks)
        .set({ usedAt: new Date().toISOString() })
        .where(eq(magicLinks.id, link.id))
        .run();
    }
  }

  const raw = createRawMagicToken();
  const expiresAt = magicLinkExpiresAt();
  db.insert(magicLinks)
    .values({
      userId,
      tokenHash: hashMagicToken(raw),
      createdBy: admin.id,
      expiresAt,
      usedAt: null,
      createdAt: new Date().toISOString(),
    })
    .run();

  const origin = await appOrigin();
  const url = `${origin}/setup?token=${encodeURIComponent(raw)}`;
  return { url, expiresAt };
}

/** Public: set password via magic link, then log in */
export async function setPasswordWithMagicLinkAction(
  formData: FormData,
): Promise<{ error?: string } | void> {
  ensureDb();
  const token = String(formData.get("token") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!token) return { error: "Missing magic link token" };
  if (password.length < 6) return { error: "Password must be at least 6 characters" };
  if (password !== confirm) return { error: "Passwords do not match" };

  const tokenHash = hashMagicToken(token);
  const link = db
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.tokenHash, tokenHash))
    .get();

  if (!link) return { error: "Invalid or expired magic link" };
  if (link.usedAt) return { error: "This magic link was already used — ask admin for a new one" };
  if (new Date(link.expiresAt).getTime() < Date.now()) {
    return { error: "This magic link has expired — ask admin for a new one" };
  }

  const user = db.select().from(users).where(eq(users.id, link.userId)).get();
  if (!user) return { error: "User not found" };

  db.update(users)
    .set({ passwordHash: bcrypt.hashSync(password, 10) })
    .where(eq(users.id, user.id))
    .run();

  db.update(magicLinks)
    .set({ usedAt: new Date().toISOString() })
    .where(eq(magicLinks.id, link.id))
    .run();

  await createSession(user);

  if (user.role !== "admin" && !user.onboardingDone) {
    const onboarding = db
      .select()
      .from(surveys)
      .where(eq(surveys.type, "onboarding"))
      .get();
    if (onboarding) redirect(`/surveys/${onboarding.id}`);
  }

  redirect(user.role === "admin" ? "/admin" : "/home");
}

export async function createAdminSurveyAction(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") || "Team pulse").trim();
  const description =
    String(formData.get("description") || "").trim() ||
    "Admin-triggered survey — content TBD / editable.";

  const questions: SurveyQuestion[] = [
    {
      id: "pulse_form",
      prompt: String(formData.get("q1") || "How was last scrim vibe? (1–10)"),
      kind: "scale",
      min: 1,
      max: 10,
    },
    {
      id: "pulse_note",
      prompt: String(formData.get("q2") || "Anything the squad should fix?"),
      kind: "text",
    },
    {
      id: "peer_pulse",
      prompt: "Anonymous: rate teammates you played with (1–10)",
      kind: "peer_rating",
      min: 1,
      max: 10,
    },
  ];

  const s = db
    .insert(surveys)
    .values({
      type: "admin",
      title,
      description,
      questionsJson: JSON.stringify(questions),
      active: true,
      createdBy: admin.id,
      createdAt: new Date().toISOString(),
    })
    .returning()
    .get();

  revalidatePath("/admin/surveys");
  revalidatePath("/");
  revalidatePath("/home");
  // Stay on this survey until admin closes it
  redirect(`/admin/surveys/${s.id}`);
}

export async function createRoleAssessmentAction() {
  const admin = await requireAdmin();
  const week = new Date().toISOString().slice(0, 10);

  // Never auto-close: reuse the same active survey for all players
  const existing = db
    .select()
    .from(surveys)
    .where(eq(surveys.type, "role_assessment"))
    .all()
    .find((s) => s.active);

  if (existing) {
    revalidatePath("/admin/surveys");
    redirect(`/admin/surveys/${existing.id}`);
  }

  const s = db
    .insert(surveys)
    .values({
      type: "role_assessment",
      title: `Weekly Role Assessment · ${week}`,
      description:
        "Mobile-friendly role questionnaire (124 Q). Rate yourself honestly. Scoring is hidden. Stays open for all players until admin closes it.",
      questionsJson: JSON.stringify({ engine: "role_assessment_v1" }),
      active: true,
      createdBy: admin.id,
      createdAt: new Date().toISOString(),
    })
    .returning()
    .get();

  revalidatePath("/admin/surveys");
  revalidatePath("/");
  revalidatePath("/home");
  redirect(`/admin/surveys/${s.id}`);
}

export async function deactivateSurveyAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("surveyId"));
  db.update(surveys).set({ active: false }).where(eq(surveys.id, id)).run();
  // Clean drafts for closed survey
  db.delete(surveyDrafts).where(eq(surveyDrafts.surveyId, id)).run();
  revalidatePath("/admin/surveys");
  revalidatePath(`/admin/surveys/${id}`);
  revalidatePath("/");
  revalidatePath("/home");
}

export async function saveRoleAssessmentDraftAction(input: {
  surveyId: number;
  answers: Record<string, unknown>;
  unclearQuestionIds: string[];
  step: number;
}): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser();
  const survey = db
    .select()
    .from(surveys)
    .where(eq(surveys.id, input.surveyId))
    .get();
  if (!survey || !survey.active || survey.type !== "role_assessment") {
    return { error: "Survey is closed — ask admin to re-open or launch again" };
  }

  const existing = db
    .select()
    .from(surveyDrafts)
    .where(eq(surveyDrafts.surveyId, input.surveyId))
    .all()
    .find((d) => d.userId === user.id);

  const payload = {
    answersJson: JSON.stringify(input.answers || {}),
    unclearJson: JSON.stringify(input.unclearQuestionIds || []),
    step: Math.max(0, Math.min(input.step || 0, 1000)),
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    db.update(surveyDrafts).set(payload).where(eq(surveyDrafts.id, existing.id)).run();
  } else {
    db.insert(surveyDrafts)
      .values({
        surveyId: input.surveyId,
        userId: user.id,
        ...payload,
      })
      .run();
  }
  return { ok: true };
}

export async function addUserAction(
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  await requireAdmin();
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("displayName") || "").trim();
  const ingameName = String(formData.get("ingameName") || "").trim() || null;
  const discord = String(formData.get("discord") || "").trim() || null;
  const uid = String(formData.get("uid") || "").trim() || null;
  const slot = String(formData.get("slot") || "").trim() || null;
  const roleRaw = String(formData.get("role") || "player");
  const role = roleRaw === "manager" ? "manager" : "player";

  if (!username || !/^[a-z0-9._-]+$/.test(username)) {
    return { error: "Username: lowercase letters, numbers, . _ - only" };
  }
  if (password.length < 6) return { error: "Password must be at least 6 characters" };
  if (!displayName) return { error: "Display name required" };

  const exists = db.select().from(users).where(eq(users.username, username)).get();
  if (exists) return { error: "Username already taken" };

  db.insert(users)
    .values({
      username,
      passwordHash: bcrypt.hashSync(password, 10),
      role,
      displayName,
      ingameName,
      discord,
      uid,
      slot,
      onboardingDone: false,
      createdAt: new Date().toISOString(),
    })
    .run();

  revalidatePath("/admin/users");
  revalidatePath("/roster");
  return { ok: true };
}

export async function submitRoleAssessmentAction(
  surveyId: number,
  answers: Record<string, unknown>,
  unclearQuestionIds: string[] = [],
): Promise<{ error?: string } | void> {
  const user = await requireUser();
  const survey = db.select().from(surveys).where(eq(surveys.id, surveyId)).get();
  if (!survey || survey.type !== "role_assessment") {
    return { error: "Survey not found" };
  }
  if (!survey.active) {
    return {
      error:
        "This survey was closed by admin. Ask them to launch again — your progress may still be in draft if they re-open the same one.",
    };
  }

  const { scoreRoleAssessment } = await import("@/lib/role-assessment");
  const profile = scoreRoleAssessment(answers);
  const scoresPayload = {
    raw: profile.raw,
    pct: profile.pct,
    ranked: profile.ranked,
    primary: profile.primary,
    secondary: profile.secondary,
    third: profile.third,
    flex: profile.flex,
    differentiation: profile.differentiation,
    identity: profile.identity,
  };

  const existing = db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.surveyId, surveyId))
    .all()
    .find((r) => r.respondentId === user.id);

  if (existing) {
    db.update(surveyResponses)
      .set({
        answersJson: JSON.stringify(answers),
        scoresJson: JSON.stringify(scoresPayload),
      })
      .where(eq(surveyResponses.id, existing.id))
      .run();
  } else {
    db.insert(surveyResponses)
      .values({
        surveyId,
        respondentId: user.id,
        answersJson: JSON.stringify(answers),
        scoresJson: JSON.stringify(scoresPayload),
        createdAt: new Date().toISOString(),
      })
      .run();
  }

  // Persist unclear flags (one vote per user per question)
  const uniqueUnclear = [...new Set(unclearQuestionIds.filter(Boolean))];
  for (const qid of uniqueUnclear) {
    const already = db
      .select()
      .from(questionFlags)
      .where(eq(questionFlags.surveyId, surveyId))
      .all()
      .find((f) => f.questionId === qid && f.userId === user.id);
    if (already) continue;
    db.insert(questionFlags)
      .values({
        surveyId,
        questionId: qid,
        userId: user.id,
        reason: "unclear",
        createdAt: new Date().toISOString(),
      })
      .run();
  }

  // Clear auto-save draft after successful submit
  const draft = db
    .select()
    .from(surveyDrafts)
    .where(eq(surveyDrafts.surveyId, surveyId))
    .all()
    .find((d) => d.userId === user.id);
  if (draft) {
    db.delete(surveyDrafts).where(eq(surveyDrafts.id, draft.id)).run();
  }

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath(`/admin/surveys/${surveyId}`);
  // Results are admin-only — players just return home
  redirect("/home?survey=done");
}

export async function submitSurveyAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const surveyId = Number(formData.get("surveyId"));
  const survey = db.select().from(surveys).where(eq(surveys.id, surveyId)).get();
  if (!survey || !survey.active) return;

  let questions: SurveyQuestion[] = [];
  try {
    const parsed = JSON.parse(survey.questionsJson) as unknown;
    questions = Array.isArray(parsed) ? (parsed as SurveyQuestion[]) : [];
  } catch {
    return;
  }
  if (questions.length === 0) return;

  const answers: Record<string, unknown> = {};

  for (const q of questions) {
    if (q.kind === "peer_rating") {
      const allowed = new Set(
        getTeammatesPlayedWith(user.id).map((p) => p.id),
      );
      const ratings: Record<string, number> = {};
      for (const [key, value] of formData.entries()) {
        if (key.startsWith(`peer_${q.id}_`)) {
          const uid = Number(key.replace(`peer_${q.id}_`, ""));
          const n = Number(value);
          // Anonymous peer ratings: only store scores for match teammates
          if (allowed.has(uid) && Number.isFinite(n)) ratings[String(uid)] = n;
        }
      }
      answers[q.id] = ratings;
    } else if (q.kind === "scale") {
      answers[q.id] = Number(formData.get(q.id) || 0);
    } else {
      answers[q.id] = String(formData.get(q.id) || "").trim();
    }
  }

  const existing = db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.surveyId, surveyId))
    .all()
    .find((r) => r.respondentId === user.id);

  if (existing) {
    db.update(surveyResponses)
      .set({ answersJson: JSON.stringify(answers) })
      .where(eq(surveyResponses.id, existing.id))
      .run();
  } else {
    db.insert(surveyResponses)
      .values({
        surveyId,
        respondentId: user.id,
        answersJson: JSON.stringify(answers),
        createdAt: new Date().toISOString(),
      })
      .run();
  }

  if (survey.type === "onboarding") {
    db.update(users)
      .set({ onboardingDone: true })
      .where(eq(users.id, user.id))
      .run();
  }

  revalidatePath("/");
  revalidatePath("/leaderboards");
  redirect("/");
}
