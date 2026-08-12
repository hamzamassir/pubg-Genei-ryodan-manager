import { createHash, randomBytes } from "crypto";

export const MAGIC_LINK_TTL_HOURS = 72;

export function hashMagicToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createRawMagicToken() {
  return randomBytes(32).toString("base64url");
}

export function magicLinkExpiresAt(hours = MAGIC_LINK_TTL_HOURS) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}
