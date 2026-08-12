import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type Role, type User } from "@/db/schema";

const COOKIE = "genei_session";
const secret = () =>
  new TextEncoder().encode(
    process.env.SESSION_SECRET || "genei-ryodan-dev-secret-change-me",
  );

export type SessionUser = {
  id: number;
  username: string;
  role: Role;
  displayName: string;
  ingameName: string | null;
  onboardingDone: boolean;
};

export async function createSession(user: User) {
  const token = await new SignJWT({
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    ingameName: user.ingameName,
    onboardingDone: user.onboardingDone,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.id);
    if (!id) return null;
    // Refresh from DB so role / onboarding flags stay current
    const row = db.select().from(users).where(eq(users.id, id)).get();
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      role: row.role,
      displayName: row.displayName,
      ingameName: row.ingameName,
      onboardingDone: row.onboardingDone,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}

export async function requireAdmin(): Promise<SessionUser> {
  const s = await requireUser();
  if (s.role !== "admin") throw new Error("FORBIDDEN");
  return s;
}

export function isAdmin(user: SessionUser | null | undefined) {
  return user?.role === "admin";
}
