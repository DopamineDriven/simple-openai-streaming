**Simple Stream Monorepo**

- Next.js + WebSocket AI chat demo with a production-leaning architecture
- Turborepo workspaces, shared packages, and a local ws-server backed by Redis

**Overview**
- apps/web: Next.js 15 (React 19) chat UI with streaming markdown rendering, Tailwind v4, motion/react, better-auth, and an edge‑friendly Prisma client.
- apps/ws-server: Node WebSocket server that validates sessions, streams responses from OpenAI, and writes to Postgres via a Node‑flavored Prisma client. Locally uses Dockerized Redis (compose.yaml) for pub/sub.
- packages/*: Reusable building blocks: db, encryption, key-validator, redis, types, and ui.

**Local Development**
- Requirements
  - Node `>=22`, pnpm `>=9`, Docker (for Redis), an OpenAI API key (provided -- provisioned one before sending this over), Postgres URLs: `DATABASE_URL` and Accelerate `DIRECT_URL` (decided to use prisma postgres pro over containerized PG, better perf/dev-speed, and optimized db handler for next (edge-friendly) vs node (persistent server friendly)).
- Environment seeding
  - You’ll receive a password‑protected zip containing a pre‑filled `env-scaffold.json`. In a separate email you’ll receive the password.
  - Unzip the archive at the repo root so `env-scaffold.json` sits alongside `populate-env.sh`.
  - Ensure `jq` is installed (macOS: `brew install jq`, Debian/Ubuntu: `sudo apt-get install jq`).
  - Run `pnpm seed:env` to distribute values from the unzipped `env-scaffold.json` into `.env` files across targets:
    - `apps/web/.env`: `ENCRYPTION_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, BETTER_AUTH_URL, BETTER_AUTH_SECRET, NEXT_PUBLIC_WS_URL, DATABASE_URL, DATABASE_API_KEY, DIRECT_URL`
    - `apps/ws-server/.env`: `ENCRYPTION_KEY, IS_PROD, DATABASE_URL, DATABASE_API_KEY, DIRECT_URL, OPENAI_API_KEY`
    - `packages/key-validator/.env`: `OPENAI_API_KEY`
    - `packages/encryption/.env`: `ENCRYPTION_KEY`
    - `packages/db/.env`: `DATABASE_URL, DATABASE_API_KEY, DIRECT_URL`
    - `packages/types/.env`: `OPENAI_API_KEY`
    - `./.env` (root): `ENCRYPTION_KEY, DATABASE_URL, DATABASE_API_KEY, DIRECT_URL, OPENAI_API_KEY`
  - The script will prompt to delete `env-scaffold.json` after generating all `.env` files.
- Install
  - `pnpm install`
- Run `pnpm build:targeted` (prisma clients will automatically generate as part of a prebuild process) 
- Start servers
  - WebSocket server: `pnpm run:ws-server` (brings up Redis via Docker and starts the ws-server on `:4000`).
  - Web app: `pnpm run:web` (Next.js dev on `:3000`). Ensure `NEXT_PUBLIC_WS_URL=ws://localhost:4000` (should be properly populated after running the preliminary pnpm seed:env command).
- All‑in dev (parallel)
  - `pnpm dev` (turbo runs packages concurrently where configured).

**Key Scripts**
- Root: `pnpm dev`, `pnpm clean:house`, `pnpm build:targeted`, `pnpm run:web`, `pnpm run:ws-server`

**Installation**
- Only run `pnpm install` from the root, never from within individual repos as it would break sym links
- To do a deep clean, fresh install, and end-to-end rebuild, run `pnpm clean:house` -- the `manage.sh` file takes care of orchestrating that process
- Once it is up and running, expand the main sidebar after signing in. You'll see your email and avatar at the bottom of the sidebar -- click on it->select "settings"->scroll down to the API section. You can securely store your openai_api_key here and it will remain 100% encrypted (AES 256 GCM Algorithm via jose) while at REST always. It's only decryted on demand in the ws-server or when toggling visibility via a secure next.js server action.

**Tech Stack**
- Next.js 15, React 19, Tailwind v4,TypeScript v5.9.3.
- Prisma (Accelerate for edge; adapter‑pg for node), Postgres.
- WebSocket server (ws), Redis pub/sub. WebSocket Client (web).
- better-auth for authentication (github).
- Turborepo + pnpm workspace (turborepo scaffold generated via my `@d0paminedriven/turbogen` package in a single command).

**Architecture Highlights**
- Dual Prisma outputs: edge and node.
  - Edge build (wasm + Accelerate): used by Next.js routes/server components; built with `--no-engine` and a swapped generator.
  - Node build (adapter-pg + native engines): used by the ws-server for high‑throughput DB writes.
  - A custom Read→Replace→Restore script runs around `prisma generate` to hot‑swap the target generator, then restores the schema post‑generation.
- Streaming transport: a thin WebSocket client in the web app pairs with a resilient ws-server. Events use shared `EventTypeMap` types.
- Markdown pipeline: fast, lightweight processing while streaming; full processing after completion (code blocks, math, tables, sanitization).

**Packages**
- `@simple-stream/db`
  - Two distributions: edge (wasm + accelerate) and node (adapter-pg).
  - Generator swapping around `prisma generate` enables: edge output `--no-engine`; node output with native binaries.
  - Exports typed clients for each environment (see `packages/db/package.json#exports`).
- `@simple-stream/encryption`
  - AES‑256‑GCM utilities to encrypt user‑provided API keys (returns iv, authTag, data). Used from server contexts only.
- `@simple-stream/key-validator`
  - Validates API keys: checks shape, detect banned/blocked or unusable (e.g., exhausted tokens). Provider‑aware (OpenAI in this demo).
- `@simple-stream/redis`
  - Centralized Redis client and pub/sub helpers for the ws-server.
- `@simple-stream/types`
  - Shared event and domain types, model catalog and utilities (e.g., `EventTypeMap`, `ChatWsEvent`, model id/display name helpers).
- `@simple-stream/ui`
  - UI component library for the web app (Tailwind v4, motion/react). Exports icons, base components, and utilities.

**Apps**
- `@simple-stream/web`
  - Next.js 15 + React 19; Tailwind v4; better-auth for auth/session; cookie middleware annotates locale/device/tz.
  - Custom markdown processing with a streaming pathway and a full post‑process pathway.
  - WebSocket client auto‑connects post sign‑in; base path is rewritten so `/` renders the dynamic chat experience.
- `@simple-stream/ws-server`
  - Persistent Node WebSocket server (no cold starts locally). Verifies user + session on handshake, interfaces with OpenAI, and performs DB writes via the Node Prisma client.
  - Local infra via Docker Compose for Redis (TCP locally; TLS/mTLS in production). Listens on `4000`.
  - Production analogue runs on AWS Fargate/ECS behind an ALB.

**Data Flow**
- User authenticates (better-auth) → web app connects to `NEXT_PUBLIC_WS_URL` (e.g., `ws://localhost:4000?id=your_id`) with a user id query param.
- Web sends `ai_chat_request` (typed via `EventTypeMap`).
- ws-server validates the session, streams `ai_chat_chunk` events (with `thinkingText`/`thinkingDuration` surfaced if you use one of the gpt-5/o3/o4 reasoning models) and finally `ai_chat_response`.
- The web app renders streaming markdown, updates title, and finalizes message state on completion.
- Conversation persistence, you can have a back and forth with the model and swap between models mid-convo with 0 issue insofar as context continutiy is concerned. 
- This is a simplified version of my [Slipstream](https://chat.aicoalesce.com) multi-provider, multi-model medium (OpenAI, xAI, Anthropic, Gemini, Meta, and Vercel as providers) which supports additional functionality such as image and document pasting/attachments.
**Production Notes**
- ws-server runs on AWS Fargate/ECS with ALB; Redis secured with TLS/mTLS; environment‑specific URL schemes (`redis://` vs `rediss://`).
- Edge Prisma client in the web app; Node Prisma client in the ws-server.

**Repository Layout (Top Level)**
- `apps/web` — Next.js chat UI
- `apps/ws-server` — WebSocket server
- `packages/db` — Prisma clients (edge + node), schema swapper, outputs
- `packages/encryption` — AES‑256‑GCM helpers
- `packages/key-validator` — Provider key validation
- `packages/redis` — Redis client/pubsub helpers
- `packages/types` — Shared types + model catalog
- `packages/ui` — UI library for apps/web
- `tooling/eslint` — Eslint presets consumed across the workspace
- `tooling/jest-presets` — convenient jest presets for the DOM and Node
- `tooling/prettier` — prettier config globally re-used by each package
- `tooling/typescript` — typescript configs tailored to various contexts

This repo is structured for clarity and portability: typed events across the stack, a robust local dev experience (Dockerized Redis), and a realistic split between edge and node runtimes for database work.
