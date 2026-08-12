"use client";

import { useState, useTransition } from "react";
import { updateUserAction, generateMagicLinkAction } from "@/app/actions";

type AdminUser = {
  id: number;
  username: string;
  role: string;
  displayName: string;
  ingameName: string | null;
  uid: string | null;
  discord: string | null;
  slot: string | null;
};

export function UserEditor({ user }: { user: AdminUser }) {
  const [pending, start] = useTransition();
  const [linkPending, startLink] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [magicUrl, setMagicUrl] = useState<string | null>(null);
  const [magicExpires, setMagicExpires] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <div className="panel-sharp space-y-3 p-4">
      <form
        className="space-y-3"
        action={(fd) => {
          start(async () => {
            setMsg(null);
            setErr(null);
            const res = await updateUserAction(fd);
            if (res?.error) setErr(res.error);
            else setMsg(res?.ok ? "Saved" : null);
          });
        }}
      >
        <input type="hidden" name="userId" value={user.id} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-lg font-bold">{user.username}</div>
            <div className="text-sm uppercase text-[var(--text-muted)]">{user.role}</div>
          </div>
          <span className="badge">{user.slot || "—"}</span>
        </div>

        <div>
          <label className="label">Display name</label>
          <input
            name="displayName"
            className="input"
            defaultValue={user.displayName}
            required
          />
        </div>
        <div>
          <label className="label">In-game name</label>
          <input
            name="ingameName"
            className="input"
            defaultValue={user.ingameName || ""}
          />
        </div>
        <div>
          <label className="label">Discord</label>
          <input
            name="discord"
            className="input"
            defaultValue={user.discord || ""}
            placeholder="@handle"
          />
        </div>
        <div>
          <label className="label">UID</label>
          <input name="uid" className="input" defaultValue={user.uid || ""} />
        </div>
        <div>
          <label className="label">Slot</label>
          <input name="slot" className="input" defaultValue={user.slot || ""} />
        </div>
        <div>
          <label className="label">Set password manually (optional)</label>
          <input
            name="password"
            type="password"
            className="input"
            autoComplete="new-password"
            placeholder="Prefer magic link instead"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn" disabled={pending}>
            {pending ? "Saving…" : "Save user"}
          </button>
          {msg && <span className="text-sm text-[var(--acid)]">{msg}</span>}
          {err && <span className="text-sm text-[var(--danger)]">{err}</span>}
        </div>
      </form>

      <div className="border-t border-[var(--border)] pt-3">
        <p className="mb-2 text-sm text-[var(--text-muted)]">
          Magic link: player opens it, chooses their own password, then logs in. Use again if they
          forget it.
        </p>
        <button
          type="button"
          className="btn btn-acid w-full"
          disabled={linkPending}
          onClick={() => {
            startLink(async () => {
              setMagicUrl(null);
              setCopied(false);
              const fd = new FormData();
              fd.set("userId", String(user.id));
              const res = await generateMagicLinkAction(fd);
              if (res.error) {
                setErr(res.error);
                return;
              }
              setMagicUrl(res.url || null);
              setMagicExpires(res.expiresAt || null);
              setErr(null);
            });
          }}
        >
          {linkPending ? "Creating…" : "Generate magic link"}
        </button>

        {magicUrl && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-[var(--acid)]">
              Copy & send on Discord (one-time, expires{" "}
              {magicExpires
                ? new Date(magicExpires).toLocaleString()
                : "in ~72h"}
              ).
            </p>
            <textarea
              className="textarea min-h-20 text-sm"
              readOnly
              value={magicUrl}
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              className="btn btn-ghost w-full text-sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(magicUrl);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
