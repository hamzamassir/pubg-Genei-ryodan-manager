"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { setPasswordWithMagicLinkAction } from "@/app/actions";

type State = { error?: string } | null;

async function setupAction(_prev: State, formData: FormData): Promise<State> {
  const result = await setPasswordWithMagicLinkAction(formData);
  return result ?? null;
}

export function SetupPasswordForm({
  token,
  username,
  displayName,
}: {
  token: string;
  username: string;
  displayName: string;
}) {
  const [state, action, pending] = useActionState(setupAction, null);

  return (
    <div className="hud-grid flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="animate-in panel w-full max-w-md p-5 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/brand/genei-spider.png"
            alt="GENEI RYODAN"
            width={88}
            height={88}
            className="mb-3 h-20 w-20 object-contain"
            priority
          />
          <h1 className="brand-font text-2xl font-extrabold tracking-wide">Set your password</h1>
          <p className="mt-2 text-base text-[var(--text-muted)]">
            {displayName} · login <span className="text-[var(--venom)]">{username}</span>
          </p>
        </div>

        <form action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <label className="label" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="confirm">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          {state?.error && (
            <p className="text-base text-[var(--danger)]">{state.error}</p>
          )}
          <button type="submit" className="btn w-full" disabled={pending}>
            {pending ? "Saving…" : "Save & enter nest"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          Already set?{" "}
          <Link href="/login" className="text-[var(--venom)]">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
