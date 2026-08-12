import fs from "fs";
import path from "path";

/**
 * credentials.local.txt format (one user per line):
 * username=password
 *
 * Lines starting with # are comments.
 */
export function loadCredentials(): Map<string, string> {
  const filePath = path.join(process.cwd(), "credentials.local.txt");
  if (!fs.existsSync(filePath)) {
    throw new Error(
      "Missing credentials.local.txt — copy credentials.local.example and fill passwords.",
    );
  }

  const map = new Map<string, string>();
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const username = line.slice(0, eq).trim();
    const password = line.slice(eq + 1).trim();
    if (username && password) map.set(username.toLowerCase(), password);
  }
  return map;
}
