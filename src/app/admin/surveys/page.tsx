import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { surveys, surveyResponses } from "@/db/schema";
import {
  createAdminSurveyAction,
  createRoleAssessmentAction,
  deactivateSurveyAction,
} from "@/app/actions";

export default async function AdminSurveysPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/home");

  const sp = await searchParams;
  const all = db.select().from(surveys).all().reverse();

  return (
    <AppShell user={session}>
      <div className="animate-in space-y-6">
        <div>
          <h1 className="page-title">Surveys</h1>
          <p className="mt-1 text-base text-[var(--text-muted)]">
            Launch the weekly role assessment (shows on player home until filled). Peer ratings stay
            anonymous. Open a survey for a clear results dashboard.
          </p>
          {sp.created && (
            <p className="mt-2 text-base text-[var(--acid)]">Survey #{sp.created} launched.</p>
          )}
        </div>

        <form action={createRoleAssessmentAction} className="panel space-y-3 p-5">
          <h2 className="section-label">Weekly role assessment</h2>
          <p className="text-base text-[var(--text-muted)]">
            124-question competitive role questionnaire (IGL / Entry / Fragger / Flanker / Scout /
            Sniper / Support / Anchor). Mobile: one question → Next. Closes previous open role
            assessments.
          </p>
          <button type="submit" className="btn w-full sm:w-auto">
            Launch weekly role assessment
          </button>
        </form>

        <form action={createAdminSurveyAction} className="panel space-y-4 p-5">
          <h2 className="section-label">Quick pulse survey</h2>
          <div>
            <label className="label">Title</label>
            <input name="title" className="input" defaultValue="Weekly pulse" required />
          </div>
          <div>
            <label className="label">Description</label>
            <input
              name="description"
              className="input"
              defaultValue="Quick vibe check + anonymous peer ratings (1–10)."
            />
          </div>
          <div>
            <label className="label">Scale question</label>
            <input
              name="q1"
              className="input"
              defaultValue="How was last scrim vibe? (1–10)"
            />
          </div>
          <div>
            <label className="label">Text question</label>
            <input
              name="q2"
              className="input"
              defaultValue="Anything the squad should fix?"
            />
          </div>
          <button type="submit" className="btn btn-ghost">
            Launch pulse survey
          </button>
        </form>

        <div className="panel overflow-hidden">
          <ul>
            {all.map((s) => {
              const responses = db
                .select()
                .from(surveyResponses)
                .where(eq(surveyResponses.surveyId, s.id))
                .all().length;
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/surveys/${s.id}`}
                      className="text-base font-semibold hover:text-[var(--venom)]"
                    >
                      {s.title}
                    </Link>
                    <div className="text-sm text-[var(--text-muted)]">
                      {s.type} · {responses} responses · {s.active ? "active" : "closed"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/surveys/${s.id}`} className="btn btn-ghost text-sm">
                      Results
                    </Link>
                    {s.active && (
                      <form action={deactivateSurveyAction}>
                        <input type="hidden" name="surveyId" value={s.id} />
                        <button type="submit" className="btn btn-ghost text-sm">
                          Close
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
