"use client";

import { useActionState } from "react";
import Image from "next/image";
import { loginAction } from "@/app/actions";

type LoginState = { error?: string } | null;

async function loginFormAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const result = await loginAction(formData);
  return result ?? null;
}

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginFormAction, null);

  return (
    <div className="hud-grid flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="animate-in panel w-full max-w-md p-5 sm:p-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <Image
            src="/brand/genei-spider.png"
            alt="GENEI RYODAN"
            width={104}
            height={104}
            className="mb-4 h-24 w-24 object-contain drop-shadow-[0_0_24px_rgba(168,85,247,0.45)] sm:h-28 sm:w-28"
            priority
          />
          <h1 className="brand-font text-2xl font-extrabold tracking-wide sm:text-3xl">
            GENEI RYODAN
          </h1>
          <p className="mt-2 text-sm font-semibold tracking-wide text-[var(--venom)]">
            GENEx · TEAM OPS
          </p>
          <p className="mt-3 max-w-xs text-base text-[var(--text-muted)]">
            Scrim logs · peer ranks · squad intel
          </p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label className="label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              className="input"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              autoComplete="current-password"
              required
            />
          </div>
          {state?.error && (
            <p className="text-base text-[var(--danger)]">{state.error}</p>
          )}
          <button type="submit" className="btn w-full" disabled={pending}>
            {pending ? "Entering…" : "Enter nest"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          New or forgot password? Ask admin for a magic link — you choose your own password.
        </p>
      </div>
    </div>
  );
}
