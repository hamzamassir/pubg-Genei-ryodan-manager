import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { UserEditor } from "@/components/UserEditor";
import { AddUserForm } from "@/components/AddUserForm";
import { getSession } from "@/lib/auth";
import { getAllUsersForAdmin } from "@/lib/stats";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/home");

  const all = getAllUsersForAdmin();

  return (
    <AppShell user={session}>
      <div className="animate-in space-y-4">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="mt-1 text-base text-[var(--text-muted)]">
            Add players, edit names / Discord, and send magic links so they set their own password.
            If they lose it, generate a new magic link.
          </p>
        </div>
        <AddUserForm />
        <div className="grid gap-4 lg:grid-cols-2">
          {all.map((u) => (
            <UserEditor key={u.id} user={u} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
