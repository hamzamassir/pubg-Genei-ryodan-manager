import Link from "next/link";
import { db } from "@/db";
import { surveys } from "@/db/schema";

/** Shown on every page while a role assessment is live — navigation never closes it. */
export function ActiveSurveyBanner({
  role,
}: {
  role: "admin" | "manager" | "player";
}) {
  const live = db
    .select()
    .from(surveys)
    .all()
    .find((s) => s.active && s.type === "role_assessment");

  if (!live) return null;

  const href =
    role === "admin" ? `/admin/surveys/${live.id}` : `/surveys/${live.id}`;

  return (
    <div className="border-b border-[var(--venom)] bg-[rgba(168,85,247,0.12)]">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:max-w-6xl sm:px-4">
        <p className="text-sm font-semibold text-[var(--venom)]">
          Live survey · #{live.id} · stays open until admin closes it
        </p>
        <Link href={href} className="text-sm font-bold text-white underline-offset-2 hover:underline">
          {role === "admin" ? "Open results" : "Continue survey"}
        </Link>
      </div>
    </div>
  );
}
