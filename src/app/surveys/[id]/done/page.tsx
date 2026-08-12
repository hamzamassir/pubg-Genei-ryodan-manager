import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { surveys, surveyResponses } from "@/db/schema";

/** Players never see role scores — only a confirmation. */
export default async function SurveyDonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const survey = db.select().from(surveys).where(eq(surveys.id, Number(id))).get();
  if (!survey) notFound();

  const response = db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.surveyId, survey.id))
    .all()
    .find((r) => r.respondentId === session.id);

  if (!response) redirect(`/surveys/${survey.id}`);

  return (
    <AppShell user={session}>
      <div className="animate-in mx-auto max-w-xl space-y-4">
        <div className="panel p-5">
          <span className="badge badge-acid">Submitted</span>
          <h1 className="page-title mt-2">Thanks — survey saved</h1>
          <p className="mt-2 text-base text-[var(--text-muted)]">
            Your answers are recorded. Role results are visible to admin only for lineup planning.
          </p>
          <Link href="/home" className="btn mt-5 w-full">
            Back to home
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
