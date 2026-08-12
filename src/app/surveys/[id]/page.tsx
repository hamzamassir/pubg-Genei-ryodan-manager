import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SurveyForm } from "@/components/SurveyForm";
import { RoleAssessmentWizard } from "@/components/RoleAssessmentWizard";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { surveys, surveyResponses, surveyDrafts, type SurveyQuestion } from "@/db/schema";
import { getTeammatesPlayedWith } from "@/lib/stats";
import { ROLE_ASSESSMENT_META } from "@/lib/role-assessment";

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") {
    const { id } = await params;
    redirect(`/admin/surveys/${id}`);
  }

  const { id } = await params;
  const survey = db
    .select()
    .from(surveys)
    .where(eq(surveys.id, Number(id)))
    .get();
  if (!survey) notFound();
  if (!survey.active) {
    return (
      <AppShell user={session}>
        <div className="panel p-5">
          <h1 className="page-title">Survey closed</h1>
          <p className="mt-2 text-base text-[var(--text-muted)]">
            Admin closed this survey. If you had progress, ask them to keep one survey open for
            everyone until you finish.
          </p>
        </div>
      </AppShell>
    );
  }

  const already = db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.surveyId, survey.id))
    .all()
    .find((r) => r.respondentId === session.id);
  if (already && survey.type === "role_assessment") {
    redirect("/home");
  }

  if (survey.type === "role_assessment") {
    const draft = db
      .select()
      .from(surveyDrafts)
      .where(eq(surveyDrafts.surveyId, survey.id))
      .all()
      .find((d) => d.userId === session.id);

    const initialDraft = draft
      ? {
          answers: JSON.parse(draft.answersJson) as Record<string, unknown>,
          unclearQuestionIds: JSON.parse(draft.unclearJson) as string[],
          step: draft.step,
        }
      : null;

    return (
      <AppShell user={session}>
        <div className="animate-in mx-auto max-w-xl space-y-4">
          <div>
            <span className="badge">Weekly · role assessment · auto-save on</span>
            <h1 className="page-title mt-2">{survey.title}</h1>
            <p className="mt-2 text-base text-[var(--text-muted)]">
              {ROLE_ASSESSMENT_META.description} Progress is saved automatically — you can refresh
              and continue.
            </p>
          </div>
          <RoleAssessmentWizard surveyId={survey.id} initialDraft={initialDraft} />
        </div>
      </AppShell>
    );
  }

  const questions = JSON.parse(survey.questionsJson) as SurveyQuestion[];
  const peers = getTeammatesPlayedWith(session.id);

  return (
    <AppShell user={session}>
      <div className="animate-in mx-auto max-w-xl space-y-4">
        <div>
          <span className="badge">Anonymous · {survey.type}</span>
          <h1 className="page-title mt-2">{survey.title}</h1>
          {survey.description && (
            <p className="mt-2 text-base text-[var(--text-muted)]">{survey.description}</p>
          )}
        </div>
        <SurveyForm
          surveyId={survey.id}
          questions={questions}
          peers={peers.map((p) => ({
            id: p.id,
            label: p.ingameName || p.displayName,
          }))}
        />
      </div>
    </AppShell>
  );
}
