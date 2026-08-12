import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { surveys, surveyResponses, users, questionFlags } from "@/db/schema";
import {
  ROLE_META,
  ROLE_CODES,
  ROLE_QUESTIONS,
  interpretBand,
  type RoleCode,
} from "@/lib/role-assessment";
import { deactivateSurveyAction } from "@/app/actions";

type ScoresPayload = {
  raw: Record<RoleCode, number>;
  pct: Record<RoleCode, number>;
  ranked: { code: RoleCode; pct: number; raw: number }[];
  primary: RoleCode;
  secondary: RoleCode;
  third: RoleCode;
  flex: RoleCode;
  differentiation: number;
  identity: string;
};

export default async function AdminSurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/home");

  const { id } = await params;
  const survey = db.select().from(surveys).where(eq(surveys.id, Number(id))).get();
  if (!survey) notFound();

  const responses = db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.surveyId, survey.id))
    .all();

  const roster = db
    .select()
    .from(users)
    .all()
    .filter((u) => u.role === "player" || u.role === "manager");

  const byUser = new Map(responses.map((r) => [r.respondentId, r]));

  const flags = db
    .select()
    .from(questionFlags)
    .where(eq(questionFlags.surveyId, survey.id))
    .all();

  const unclearMap = new Map<string, number>();
  for (const f of flags) {
    unclearMap.set(f.questionId, (unclearMap.get(f.questionId) || 0) + 1);
  }
  const unclearSorted = [...unclearMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([questionId, votes]) => {
      const q = ROLE_QUESTIONS.find((x) => x.id === questionId);
      return {
        questionId,
        votes,
        prompt: q?.prompt || questionId,
        section: q ? `S${q.section}` : "—",
      };
    });

  const qLookup = new Map(ROLE_QUESTIONS.map((q) => [q.id, q]));

  return (
    <AppShell user={session}>
      <div className="animate-in space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href="/admin/surveys" className="text-sm font-semibold text-[var(--text-muted)]">
              ← Surveys
            </Link>
            <h1 className="page-title mt-1">{survey.title}</h1>
            <p className="text-base text-[var(--text-muted)]">
              {survey.type} · {responses.length}/{roster.length} players submitted ·{" "}
              {survey.active ? "active" : "closed"}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Questions in code:{" "}
              <code className="text-[var(--venom)]">src/lib/role-assessment.ts</code>
            </p>
          </div>
          {survey.active && (
            <form action={deactivateSurveyAction}>
              <input type="hidden" name="surveyId" value={survey.id} />
              <button type="submit" className="btn btn-ghost">
                Close survey
              </button>
            </form>
          )}
        </div>

        {survey.type === "role_assessment" && (
          <section className="panel border-[var(--warn)] p-4 sm:p-5">
            <h2 className="section-label text-[var(--warn)]">Unclear questions</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Players can flag any question. Count = how many members marked it unclear.
            </p>
            {unclearSorted.length === 0 ? (
              <p className="mt-3 text-base text-[var(--text-muted)]">No unclear flags yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {unclearSorted.map((row) => (
                  <li
                    key={row.questionId}
                    className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border)] pb-3 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[var(--venom)]">
                        {row.questionId} · {row.section}
                      </div>
                      <div className="text-base">{row.prompt}</div>
                    </div>
                    <span className="badge badge-off shrink-0">{row.votes} unclear</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {survey.type === "role_assessment" ? (
          <div className="space-y-4">
            <p className="panel-sharp p-4 text-base text-[var(--text-muted)]">
              Role % = raw ÷ max for that role. Admin-only — players never see these scores.
            </p>

            {roster.map((u) => {
              const r = byUser.get(u.id);
              const scores = r?.scoresJson
                ? (JSON.parse(r.scoresJson) as ScoresPayload)
                : null;
              const answers = r?.answersJson
                ? (JSON.parse(r.answersJson) as Record<string, unknown>)
                : null;
              const userFlags = flags.filter((f) => f.userId === u.id);

              return (
                <article key={u.id} className="panel p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-extrabold">
                        {u.ingameName || u.displayName}
                      </h2>
                      <p className="text-sm text-[var(--text-muted)]">
                        {u.displayName} · {u.slot}
                      </p>
                    </div>
                    {!scores ? (
                      <span className="badge badge-off">Pending</span>
                    ) : (
                      <span className="badge badge-acid">Done</span>
                    )}
                  </div>

                  {scores ? (
                    <div className="mt-4 space-y-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="panel-sharp p-3">
                          <div className="text-sm text-[var(--text-muted)]">Primary</div>
                          <div className="text-base font-bold text-[var(--venom)]">
                            {ROLE_META[scores.primary].emoji} {ROLE_META[scores.primary].name}
                          </div>
                          <div className="text-2xl font-extrabold">
                            {scores.pct[scores.primary]}%
                          </div>
                          <div className="text-sm text-[var(--text-muted)]">
                            {interpretBand(scores.pct[scores.primary])}
                          </div>
                        </div>
                        <div className="panel-sharp p-3">
                          <div className="text-sm text-[var(--text-muted)]">Secondary / 3rd / Flex</div>
                          <div className="text-sm">
                            {ROLE_META[scores.secondary].emoji} {ROLE_META[scores.secondary].short}{" "}
                            {scores.pct[scores.secondary]}%
                          </div>
                          <div className="text-sm">
                            {ROLE_META[scores.third].emoji} {ROLE_META[scores.third].short}{" "}
                            {scores.pct[scores.third]}%
                          </div>
                          <div className="text-sm">
                            {ROLE_META[scores.flex].emoji} {ROLE_META[scores.flex].short}{" "}
                            {scores.pct[scores.flex]}%
                          </div>
                          <div className="mt-1 text-sm text-[var(--acid)]">
                            Differentiation: {scores.differentiation}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-semibold">{scores.identity}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[280px] text-left text-sm">
                          <thead className="text-[var(--text-muted)]">
                            <tr>
                              <th className="py-1">Role</th>
                              <th className="py-1 text-right">%</th>
                              <th className="py-1 text-right">Raw</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scores.ranked.map((row) => (
                              <tr key={row.code} className="border-t border-[var(--border)]">
                                <td className="py-1.5">
                                  {ROLE_META[row.code].emoji} {ROLE_META[row.code].short}
                                </td>
                                <td className="py-1.5 text-right font-bold">{row.pct}%</td>
                                <td className="py-1.5 text-right text-[var(--text-muted)]">
                                  {row.raw}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {userFlags.length > 0 && (
                        <div className="text-sm">
                          <div className="font-semibold text-[var(--warn)]">
                            Flagged unclear ({userFlags.length})
                          </div>
                          <ul className="mt-1 space-y-1 text-[var(--text-muted)]">
                            {userFlags.map((f) => (
                              <li key={f.id}>
                                {f.questionId}: {qLookup.get(f.questionId)?.prompt || "—"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {answers && (
                        <details className="text-sm text-[var(--text-muted)]">
                          <summary className="cursor-pointer font-semibold text-[var(--text)]">
                            Profile answers (Q1–Q10)
                          </summary>
                          <ul className="mt-2 space-y-1">
                            {["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10"].map(
                              (qid) => (
                                <li key={qid}>
                                  <span className="text-[var(--venom)]">{qid}:</span>{" "}
                                  {Array.isArray(answers[qid])
                                    ? (answers[qid] as string[]).join(", ")
                                    : String(answers[qid] ?? "—")}
                                </li>
                              ),
                            )}
                          </ul>
                        </details>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-base text-[var(--text-muted)]">Not submitted yet.</p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-base text-[var(--text-muted)]">
              Pulse surveys: peer ratings stay anonymous aggregates.
            </p>
            {responses.length === 0 ? (
              <p className="text-base text-[var(--text-muted)]">No responses yet.</p>
            ) : (
              responses.map((r) => {
                const u = roster.find((x) => x.id === r.respondentId);
                const answers = JSON.parse(r.answersJson) as Record<string, unknown>;
                const safeEntries = Object.entries(answers).filter(
                  ([, v]) => typeof v !== "object" || v === null || Array.isArray(v),
                );
                return (
                  <article key={r.id} className="panel-sharp p-4">
                    <div className="font-bold">{u?.ingameName || u?.displayName || "Player"}</div>
                    <ul className="mt-2 space-y-1 text-sm">
                      {safeEntries.map(([k, v]) => (
                        <li key={k}>
                          <span className="text-[var(--venom)]">{k}:</span>{" "}
                          {Array.isArray(v) ? v.join(", ") : String(v)}
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })
            )}
          </div>
        )}

        {survey.type === "role_assessment" && responses.length > 1 && (
          <section className="panel p-4 sm:p-5">
            <h2 className="section-label mb-3">Squad primary-role snapshot</h2>
            <ul className="space-y-2">
              {ROLE_CODES.map((code) => {
                const holders = roster.filter((u) => {
                  const r = byUser.get(u.id);
                  if (!r?.scoresJson) return false;
                  const s = JSON.parse(r.scoresJson) as ScoresPayload;
                  return s.primary === code;
                });
                if (holders.length === 0) return null;
                return (
                  <li key={code} className="flex flex-wrap gap-2 text-base">
                    <span className="font-bold text-[var(--venom)]">
                      {ROLE_META[code].emoji} {ROLE_META[code].short}:
                    </span>
                    <span>
                      {holders.map((h) => h.ingameName || h.displayName).join(", ")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
