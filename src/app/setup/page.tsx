import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { ensureDb } from "@/db/seed";
import { magicLinks, users } from "@/db/schema";
import { hashMagicToken } from "@/lib/magic-link";
import { SetupPasswordForm } from "@/components/SetupPasswordForm";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  ensureDb();
  const sp = await searchParams;
  const token = (sp.token || "").trim();

  if (!token) {
    return (
      <div className="hud-grid flex min-h-dvh items-center justify-center px-4">
        <div className="panel max-w-md p-6 text-center">
          <h1 className="page-title">Invalid link</h1>
          <p className="mt-2 text-base text-[var(--text-muted)]">
            Ask your admin for a new magic link.
          </p>
          <Link href="/login" className="btn mt-4 inline-flex">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const link = db
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.tokenHash, hashMagicToken(token)))
    .get();

  const expired =
    !link ||
    !!link.usedAt ||
    new Date(link.expiresAt).getTime() < Date.now();

  if (expired || !link) {
    return (
      <div className="hud-grid flex min-h-dvh items-center justify-center px-4">
        <div className="panel max-w-md p-6 text-center">
          <h1 className="page-title">Link expired or used</h1>
          <p className="mt-2 text-base text-[var(--text-muted)]">
            Ask admin to generate a new magic link (Users → Generate magic link).
          </p>
          <Link href="/login" className="btn mt-4 inline-flex">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const user = db.select().from(users).where(eq(users.id, link.userId)).get();
  if (!user) {
    return (
      <div className="hud-grid flex min-h-dvh items-center justify-center px-4">
        <div className="panel max-w-md p-6 text-center">
          <h1 className="page-title">User missing</h1>
          <Link href="/login" className="btn mt-4 inline-flex">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SetupPasswordForm
      token={token}
      username={user.username}
      displayName={user.displayName}
    />
  );
}
