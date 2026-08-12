import Link from "next/link";
import Image from "next/image";
import { logoutAction } from "@/app/actions";
import type { SessionUser } from "@/lib/auth";
import { DesktopNav, MobileNav } from "@/components/NavLinks";
import { ActiveSurveyBanner } from "@/components/ActiveSurveyBanner";

const links = [
  { href: "/home", label: "Home", roles: ["player", "manager"] },
  { href: "/admin", label: "Home", roles: ["admin"] },
  { href: "/leaderboards", label: "Ranks", roles: ["player", "manager", "admin"] },
  { href: "/roster", label: "Roster", roles: ["player", "manager", "admin"] },
  { href: "/admin/match-days", label: "Matches", roles: ["admin"] },
  { href: "/admin/users", label: "Users", roles: ["admin"] },
  { href: "/admin/surveys", label: "Surveys", roles: ["admin"] },
];

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const nav = links
    .filter((l) => l.roles.includes(user.role))
    .map(({ href, label }) => ({ href, label }));

  return (
    <div className="hud-grid flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(5,5,6,0.92)] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-3 py-3 sm:max-w-6xl sm:px-4">
          <Link
            href={user.role === "admin" ? "/admin" : "/home"}
            className="flex min-w-0 items-center gap-2.5"
          >
            <Image
              src="/brand/genei-spider.png"
              alt="GENEI RYODAN"
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 object-contain"
              priority
            />
            <div className="min-w-0 leading-tight">
              <div className="brand-font truncate text-base font-extrabold tracking-wide text-white sm:text-lg">
                GENEI RYODAN
              </div>
              <div className="text-xs font-semibold tracking-wide text-[var(--venom)]">
                GENEx · OPS
              </div>
            </div>
          </Link>

          <DesktopNav items={nav} />

          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">{user.displayName}</div>
              <div className="text-xs uppercase text-[var(--text-muted)]">{user.role}</div>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost !min-h-11 px-3 text-sm">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <ActiveSurveyBanner role={user.role} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-5 pb-24 sm:max-w-6xl sm:px-4 sm:py-6 sm:pb-8">
        {children}
      </main>

      <MobileNav
        items={
          user.role === "admin"
            ? nav.filter((l) =>
                ["/admin", "/admin/match-days", "/admin/users", "/admin/surveys", "/roster"].includes(
                  l.href,
                ),
              )
            : nav.slice(0, 4)
        }
      />
    </div>
  );
}
