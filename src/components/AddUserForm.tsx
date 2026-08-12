"use client";

import { useState, useTransition } from "react";
import { addUserAction } from "@/app/actions";

export function AddUserForm() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      className="panel space-y-3 p-4"
      action={(fd) => {
        start(async () => {
          setMsg(null);
          setErr(null);
          const res = await addUserAction(fd);
          if (res?.error) setErr(res.error);
          else {
            setMsg("User added");
            (document.getElementById("add-user-form") as HTMLFormElement | null)?.reset();
          }
        });
      }}
      id="add-user-form"
    >
      <h2 className="section-label">Add user</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Username (login)</label>
          <input name="username" className="input" required autoCapitalize="none" />
        </div>
        <div>
          <label className="label">Password</label>
          <input name="password" type="password" className="input" required minLength={6} />
        </div>
        <div>
          <label className="label">Display name</label>
          <input name="displayName" className="input" required />
        </div>
        <div>
          <label className="label">In-game name</label>
          <input name="ingameName" className="input" placeholder="GENEIx..." />
        </div>
        <div>
          <label className="label">Discord</label>
          <input name="discord" className="input" placeholder="@handle" />
        </div>
        <div>
          <label className="label">UID</label>
          <input name="uid" className="input" />
        </div>
        <div>
          <label className="label">Slot</label>
          <input name="slot" className="input" placeholder="P7" />
        </div>
        <div>
          <label className="label">Role</label>
          <select name="role" className="select" defaultValue="player">
            <option value="player">Player</option>
            <option value="manager">Manager</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Adding…" : "Add user"}
        </button>
        {msg && <span className="text-sm text-[var(--acid)]">{msg}</span>}
        {err && <span className="text-sm text-[var(--danger)]">{err}</span>}
      </div>
    </form>
  );
}
