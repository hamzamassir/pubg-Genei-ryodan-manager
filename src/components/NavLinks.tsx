"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

function isActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {items.map((l) => {
        const active = isActive(l.href, pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 px-3 py-2 text-sm font-semibold transition ${
              active
                ? "border-[var(--venom)] text-[var(--venom)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--venom)]"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav" aria-label="Primary">
      {items.map((l) => {
        const active = isActive(l.href, pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={active ? "nav-active" : undefined}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
