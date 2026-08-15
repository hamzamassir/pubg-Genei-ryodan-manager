import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import {
  ROLE_CODES,
  ROLE_META,
  ROLE_QUESTIONS,
  type RoleQuestion,
} from "@/lib/role-assessment";

const SCALE_LABELS = [
  { n: 1, label: "Very weak" },
  { n: 2, label: "Weak" },
  { n: 3, label: "Average" },
  { n: 4, label: "Strong" },
  { n: 5, label: "Elite" },
];

function optionsBlock(q: RoleQuestion) {
  if (q.kind === "scale") {
    return (
      <ul className="mt-2 grid gap-1 sm:grid-cols-5">
        {SCALE_LABELS.map((s) => (
          <li
            key={s.n}
            className="border border-[var(--border)] px-2 py-1.5 text-center text-sm"
          >
            <span className="font-extrabold text-[var(--venom)]">{s.n}</span>
            <div className="text-xs text-[var(--text-muted)]">{s.label}</div>
          </li>
        ))}
      </ul>
    );
  }
  if (q.kind === "single" || q.kind === "multi") {
    return (
      <ul className="mt-2 space-y-1">
        {q.options.map((opt, i) => (
          <li key={opt} className="text-base">
            <span className="font-bold text-[var(--venom)]">
              {String.fromCharCode(65 + i)}.
            </span>{" "}
            {opt}
            {q.kind === "multi" && (
              <span className="ml-1 text-xs text-[var(--text-muted)]">(multi)</span>
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (q.kind === "choice") {
    return (
      <ul className="mt-2 space-y-2">
        {q.options.map((opt) => (
          <li key={opt.key} className="border border-[var(--border)] px-3 py-2">
            <div className="text-base font-semibold">
              <span className="mr-2 font-extrabold text-[var(--venom)]">{opt.key}.</span>
              {opt.label}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--text-muted)]">
              {ROLE_CODES.map((code, i) => (
                <span key={code}>
                  {ROLE_META[code].short}:{opt.scores[i] ?? 0}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="mt-2 text-sm text-[var(--text-muted)]">Free text answer</p>;
}

export default async function QuestionGuidePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/home");

  const bySection = new Map<number, RoleQuestion[]>();
  for (const q of ROLE_QUESTIONS) {
    const list = bySection.get(q.section) || [];
    list.push(q);
    bySection.set(q.section, list);
  }
  const sections = [...bySection.entries()];

  return (
    <AppShell user={session}>
      <div className="animate-in space-y-5">
        <div>
          <Link href="/admin/surveys" className="text-sm font-semibold text-[var(--text-muted)]">
            ← Surveys
          </Link>
          <h1 className="page-title mt-1">Question guide</h1>
          <p className="mt-1 text-base text-[var(--text-muted)]">
            Full key for A / B / C / D choices and 1–5 scales. Open this beside player results to
            judge answers.
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {ROLE_QUESTIONS.length} questions · {sections.length} sections
          </p>
        </div>

        <nav className="panel sticky top-[4.5rem] z-30 flex flex-wrap gap-2 p-3">
          {sections.map(([section, qs]) => (
            <a
              key={section}
              href={`#section-${section}`}
              className="btn btn-ghost !min-h-9 px-2.5 text-sm"
              title={qs[0]?.sectionTitle}
            >
              S{section}
            </a>
          ))}
        </nav>

        {sections.map(([section, qs]) => (
          <section
            key={section}
            id={`section-${section}`}
            className="panel scroll-mt-36 space-y-4 p-4 sm:p-5"
          >
            <h2 className="section-label text-[var(--acid)]">
              Section {section}: {qs[0]?.sectionTitle}
            </h2>
            {qs.map((q) => (
              <article
                key={q.id}
                id={q.id}
                className="scroll-mt-40 border-b border-[var(--border)] pb-4 last:border-0"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-extrabold text-[var(--venom)]">{q.id}</span>
                  <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                    {q.kind}
                    {q.scored ? " · scored" : " · profile"}
                  </span>
                </div>
                <p className="mt-1 text-base font-semibold leading-snug">{q.prompt}</p>
                {optionsBlock(q)}
              </article>
            ))}
          </section>
        ))}
      </div>
    </AppShell>
  );
}
