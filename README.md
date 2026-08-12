# GENEI RYODAN / GENEx Manager

PUBG Mobile team ops for **GENEI RYODAN** (tag **GENEx**): roster, match-day scoring, surveys, leaderboards.

## Architecture (v1)

| Layer | Choice |
|--------|--------|
| App | Next.js 16 (App Router) + TypeScript + Tailwind |
| DB | SQLite via `better-sqlite3` + Drizzle schema (`data/genei.db`) |
| Auth | Username/password from `credentials.local.txt`, JWT session cookie |
| Hosting (later) | ThinkPad X260 Ubuntu + Tailscale (`x260.tail07c06e.ts.net`) |

### Data model

- **users** — admin / manager / player; roster fields (UID, WhatsApp, slot)
- **match_days** — date/time, planned game count (3–5), notes
- **games** — map (Erangel \| Miramar \| Rondo), placement, status `completed` \| `off`
- **game_players** — kills / assists per player in a game
- **surveys** — `onboarding` \| `admin`, JSON question set
- **survey_responses** — answers JSON (incl. peer ratings)

**Completed game rule:** ≥3 players assigned **and** placement set → `completed` and counts for leaderboards. Otherwise `OFF`.

**Roles:** Dashboard **admin** ≠ Team **Manager** (OBA). OBA is manager on the roster; admin is a separate login.

**Overall formula** (shown in UI):

`Overall = (avg kills × 3) + (avg assists × 1.5) + (placement pts × 2) + (peer × 2)`  
Placement pts = average of `(17 − finish)`. Peer = average teammate rating (1–5).

## Phase 1 — run locally (Mac)

```bash
cp credentials.local.example credentials.local.txt
# edit passwords, then:
npm install
npm run dev
```

Open [http://localhost:3040](http://localhost:3040).

### Default local passwords (change in `credentials.local.txt`)

| User | Role | Password (dev seed file) |
|------|------|---------------------------|
| `admin` | Dashboard admin | `genei-admin-2026` |
| `oba` | Manager (player login) | `oba-genei-2026` |
| `tonik` / `nabil` / `zed` / `ice` / `ninja` | Players | `*-genei-2026` |

`credentials.local.txt` and `data/*.db` are **gitignored**. Commit only `credentials.local.example`.

Reset DB + re-seed:

```bash
npm run db:reset
```

## Phase 2 — deploy on X260 (Tailscale)

**Team URL (Tailscale):** [http://x260.tail07c06e.ts.net:3040](http://x260.tail07c06e.ts.net:3040)  
Also: `http://100.95.212.44:3040`  
Players need Tailscale joined to your tailnet (same as accessing other X260 services).

Workflow:

1. On Mac: edit → commit → `git push`
2. On X260:

```bash
cd ~/pubg-Genei-ryodan-manager
git pull --ff-only
npm install
npm run build
sudo systemctl restart genei-ryodan
```

First-time setup (already done if you used the agent deploy):

- Node.js 22+, build tools for `better-sqlite3`
- `credentials.local.txt` + `.env` on the server (never committed)
- systemd unit: `deploy/genei-ryodan.service` → `/etc/systemd/system/genei-ryodan.service`

Magic links use `APP_ORIGIN` from `.env` so generated URLs point at the Tailscale host.

Do **not** commit real passwords. No CI / deploy keys unless requested.

## Product map

| Area | Path |
|------|------|
| Login | `/login` |
| Player home | `/home` |
| Leaderboards | `/leaderboards` |
| Roster | `/roster` |
| Surveys | `/surveys/[id]` |
| Admin | `/admin` |
| Match days | `/admin/match-days` |
| Launch surveys | `/admin/surveys` |

WhatsApp is **manual entry only** (no API).
