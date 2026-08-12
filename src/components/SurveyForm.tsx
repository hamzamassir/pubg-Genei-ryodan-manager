"use client";

import { useTransition } from "react";
import { submitSurveyAction } from "@/app/actions";
import type { SurveyQuestion } from "@/db/schema";

export function SurveyForm({
  surveyId,
  questions,
  peers,
}: {
  surveyId: number;
  questions: SurveyQuestion[];
  peers: { id: number; label: string }[];
}) {
  const [pending, start] = useTransition();
  const hasPeers = peers.length > 0;

  return (
    <form
      className="panel space-y-6 p-4 sm:p-5"
      action={async (fd) => {
        start(async () => {
          await submitSurveyAction(fd);
        });
      }}
    >
      <input type="hidden" name="surveyId" value={surveyId} />

      <div className="border border-[var(--border)] bg-[rgba(168,85,247,0.08)] p-3 text-sm leading-relaxed text-[var(--text-muted)]">
        Peer ratings are <span className="font-semibold text-[var(--acid)]">anonymous</span>.
        Only teammates you played completed games with appear below. Nobody sees who rated whom —
        only aggregated peer scores on the leaderboard.
      </div>

      {questions.map((q) => (
        <fieldset key={q.id} className="space-y-3">
          <legend className="text-base font-semibold text-[var(--text)]">{q.prompt}</legend>

          {q.kind === "scale" && (
            <div className="flex flex-wrap gap-2">
              {Array.from(
                { length: (q.max ?? 10) - (q.min ?? 1) + 1 },
                (_, i) => (q.min ?? 1) + i,
              ).map((n) => (
                <label
                  key={n}
                  className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1 border border-[var(--border)] px-2 has-[:checked]:border-[var(--venom)]"
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={n}
                    required
                    className="accent-[var(--venom)]"
                  />
                  <span className="text-base font-bold">{n}</span>
                </label>
              ))}
            </div>
          )}

          {q.kind === "text" && (
            <textarea name={q.id} className="textarea" placeholder="Type here…" />
          )}

          {q.kind === "peer_rating" && (
            <div className="space-y-3">
              {!hasPeers ? (
                <p className="text-base text-[var(--text-muted)]">
                  No match teammates yet. Play completed games first — then you can rate the
                  players who were in those lobbies with you.
                </p>
              ) : (
                peers.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col gap-2 border border-[var(--border)] p-3"
                  >
                    <span className="text-base font-semibold">{p.label}</span>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        { length: (q.max ?? 10) - (q.min ?? 1) + 1 },
                        (_, i) => (q.min ?? 1) + i,
                      ).map((n) => (
                        <label
                          key={n}
                          className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center border border-[var(--border)] text-sm font-bold has-[:checked]:border-[var(--acid)] has-[:checked]:text-[var(--acid)]"
                        >
                          <input
                            type="radio"
                            name={`peer_${q.id}_${p.id}`}
                            value={n}
                            required={hasPeers}
                            className="sr-only"
                          />
                          {n}
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </fieldset>
      ))}

      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "Submitting…" : "Submit survey"}
      </button>
    </form>
  );
}
