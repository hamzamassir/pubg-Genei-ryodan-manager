"use client";

import { useTransition } from "react";
import { deleteMatchDayAction } from "@/app/actions";

export function DeleteMatchDayButton({
  matchDayId,
  title,
}: {
  matchDayId: number;
  title: string;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      className="btn btn-danger text-sm"
      disabled={pending}
      onClick={() => {
        const ok = window.confirm(
          `Delete match day "${title}"?\n\nThis permanently removes all games and player scores for this day. This cannot be undone.`,
        );
        if (!ok) return;
        const fd = new FormData();
        fd.set("matchDayId", String(matchDayId));
        start(async () => {
          await deleteMatchDayAction(fd);
        });
      }}
    >
      {pending ? "Deleting…" : "Delete match day"}
    </button>
  );
}
