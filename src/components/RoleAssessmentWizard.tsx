"use client";

import { useMemo, useState, useTransition } from "react";
import { submitRoleAssessmentAction } from "@/app/actions";
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

export function RoleAssessmentWizard({ surveyId }: { surveyId: number }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [unclear, setUnclear] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const total = ROLE_QUESTIONS.length;
  const q = ROLE_QUESTIONS[step] as RoleQuestion;
  const progress = Math.round(((step + 1) / total) * 100);
  const isUnclear = unclear.has(q.id);

  const canNext = useMemo(() => {
    if (isUnclear) return true; // can skip answering if flagged unclear
    const v = answers[q.id];
    if (q.kind === "multi") {
      return Array.isArray(v) && v.length > 0;
    }
    if (q.kind === "text") {
      return typeof v === "string" && v.trim().length > 0;
    }
    return v !== undefined && v !== null && v !== "";
  }, [answers, q, isUnclear]);

  function setAnswer(value: unknown) {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    setError(null);
  }

  function toggleUnclear() {
    setUnclear((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
    setError(null);
  }

  function next() {
    if (!canNext) {
      setError("Answer the question, or flag it as unclear");
      return;
    }
    if (step < total - 1) setStep((s) => s + 1);
    else {
      start(async () => {
        const res = await submitRoleAssessmentAction(
          surveyId,
          answers,
          [...unclear],
        );
        if (res?.error) setError(res.error);
      });
    }
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  return (
    <div className="panel space-y-4 p-4 sm:p-5">
      <div>
        <div className="mb-1 flex items-center justify-between gap-2 text-sm text-[var(--text-muted)]">
          <span>
            Q{step + 1} / {total}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full bg-[rgba(255,255,255,0.06)]">
          <div
            className="h-2 bg-[var(--venom)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-semibold text-[var(--venom)]">
          Section {q.section}: {q.sectionTitle}
        </p>
      </div>

      <h2 className="text-lg font-bold leading-snug sm:text-xl">{q.prompt}</h2>

      {isUnclear ? (
        <p className="border border-[var(--warn)] bg-[rgba(245,165,36,0.08)] p-3 text-base text-[var(--warn)]">
          Marked as unclear — you can skip answering and continue. Admin will see this flag.
        </p>
      ) : (
        <>
          {q.kind === "text" && (
            <input
              className="input"
              value={String(answers[q.id] ?? "")}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer"
              autoFocus
            />
          )}

          {q.kind === "single" && (
            <div className="space-y-2">
              {q.options.map((opt) => {
                const selected = answers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(opt)}
                    className={`block w-full border px-3 py-3 text-left text-base ${
                      selected
                        ? "border-[var(--venom)] bg-[rgba(168,85,247,0.12)] text-[var(--venom)]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.kind === "multi" && (
            <div className="space-y-2">
              {q.options.map((opt) => {
                const selected = Array.isArray(answers[q.id])
                  ? (answers[q.id] as string[]).includes(opt)
                  : false;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const cur = Array.isArray(answers[q.id])
                        ? [...(answers[q.id] as string[])]
                        : [];
                      if (cur.includes(opt)) setAnswer(cur.filter((x) => x !== opt));
                      else setAnswer([...cur, opt]);
                    }}
                    className={`block w-full border px-3 py-3 text-left text-base ${
                      selected
                        ? "border-[var(--acid)] bg-[rgba(57,255,20,0.08)] text-[var(--acid)]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {selected ? "✓ " : ""}
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.kind === "scale" && (
            <div className="space-y-2">
              <p className="text-sm text-[var(--text-muted)]">1 = Very weak · 5 = Elite</p>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((n) => {
                  const selected = Number(answers[q.id]) === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAnswer(n)}
                      className={`flex min-h-14 flex-col items-center justify-center border ${
                        selected
                          ? "border-[var(--venom)] bg-[rgba(168,85,247,0.15)] text-[var(--venom)]"
                          : "border-[var(--border)]"
                      }`}
                    >
                      <span className="text-xl font-extrabold">{n}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {SCALE_LABELS[n]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {q.kind === "choice" && (
            <div className="space-y-2">
              {q.options.map((opt) => {
                const selected = answers[q.id] === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setAnswer(opt.key)}
                    className={`block w-full border px-3 py-3 text-left text-base ${
                      selected
                        ? "border-[var(--venom)] bg-[rgba(168,85,247,0.12)] text-[var(--venom)]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    <span className="mr-2 font-bold text-[var(--venom)]">{opt.key}.</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={toggleUnclear}
        className={`btn w-full text-sm ${
          isUnclear ? "btn-danger" : "btn-ghost"
        }`}
      >
        {isUnclear ? "Unclear flagged — tap to undo" : "Flag as unclear"}
      </button>

      {error && <p className="text-base text-[var(--danger)]">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          className="btn btn-ghost flex-1"
          onClick={back}
          disabled={step === 0 || pending}
        >
          Back
        </button>
        <button
          type="button"
          className="btn flex-[2]"
          onClick={next}
          disabled={pending}
        >
          {pending ? "Saving…" : step === total - 1 ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  );
}
