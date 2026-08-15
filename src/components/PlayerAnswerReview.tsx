import {
  ROLE_QUESTIONS,
  type RoleQuestion,
} from "@/lib/role-assessment";

const SCALE_LABELS: Record<number, string> = {
  1: "Very weak",
  2: "Weak",
  3: "Average",
  4: "Strong",
  5: "Elite",
};

function formatValue(q: RoleQuestion, raw: unknown): string {
  if (raw === undefined || raw === null || raw === "") return "—";
  if (Array.isArray(raw)) return raw.length ? raw.join(", ") : "—";
  if (q.kind === "scale") {
    const n = Number(raw);
    if (Number.isFinite(n) && SCALE_LABELS[n]) return `${n} — ${SCALE_LABELS[n]}`;
  }
  return String(raw);
}

/** Admin-only: every question + this player's answer, grouped by section. */
export function PlayerAnswerReview({
  answers,
  unclearQuestionIds,
  playerLabel,
}: {
  answers: Record<string, unknown>;
  unclearQuestionIds: string[];
  playerLabel: string;
}) {
  const unclear = new Set(unclearQuestionIds);
  const bySection = new Map<number, RoleQuestion[]>();
  for (const q of ROLE_QUESTIONS) {
    const list = bySection.get(q.section) || [];
    list.push(q);
    bySection.set(q.section, list);
  }

  const answered = ROLE_QUESTIONS.filter((q) => {
    const v = answers[q.id];
    if (unclear.has(q.id)) return true;
    if (v === undefined || v === null || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  }).length;

  return (
    <details className="mt-3 border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-3 sm:p-4">
      <summary className="cursor-pointer text-base font-bold text-[var(--venom)]">
        All answers · {playerLabel} ({answered}/{ROLE_QUESTIONS.length})
      </summary>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Full questionnaire for judging — scores above are computed from these.
      </p>
      <div className="mt-4 space-y-5">
        {[...bySection.entries()].map(([section, qs]) => (
          <div key={section}>
            <h3 className="section-label text-[var(--acid)]">
              Section {section}: {qs[0]?.sectionTitle}
            </h3>
            <ul className="mt-2 space-y-3">
              {qs.map((q) => {
                const flagged = unclear.has(q.id);
                const value = formatValue(q, answers[q.id]);
                return (
                  <li
                    key={q.id}
                    className="border-b border-[var(--border)] pb-3 last:border-0"
                  >
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-bold text-[var(--venom)]">{q.id}</span>
                      {flagged && (
                        <span className="badge badge-off text-xs">unclear</span>
                      )}
                      {!q.scored && (
                        <span className="text-xs text-[var(--text-muted)]">profile</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-[var(--text-muted)]">{q.prompt}</p>
                    <p
                      className={`mt-1 text-base font-semibold ${
                        flagged ? "text-[var(--warn)]" : "text-[var(--text)]"
                      }`}
                    >
                      {flagged && (!answers[q.id] || answers[q.id] === "")
                        ? "Skipped (flagged unclear)"
                        : value}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
