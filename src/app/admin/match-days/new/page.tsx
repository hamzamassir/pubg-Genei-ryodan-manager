import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { createMatchDayAction } from "@/app/actions";

export default async function NewMatchDayPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/home");

  const defaultLocal = new Date();
  defaultLocal.setMinutes(defaultLocal.getMinutes() - defaultLocal.getTimezoneOffset());
  const defaultValue = defaultLocal.toISOString().slice(0, 16);

  return (
    <AppShell user={session}>
      <div className="animate-in mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-black">New match day</h1>
        <form action={createMatchDayAction} className="panel space-y-4 p-5">
          <div>
            <label className="label" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              className="input"
              defaultValue="Scrim"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="playedAt">
              Date / time
            </label>
            <input
              id="playedAt"
              name="playedAt"
              type="datetime-local"
              className="input"
              defaultValue={defaultValue}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="plannedGames">
              Number of games (3–5)
            </label>
            <select
              id="plannedGames"
              name="plannedGames"
              className="select"
              defaultValue="3"
            >
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="notes">
              Notes
            </label>
            <textarea id="notes" name="notes" className="textarea min-h-20" />
          </div>
          <button type="submit" className="btn w-full">
            Create & score games
          </button>
        </form>
      </div>
    </AppShell>
  );
}
