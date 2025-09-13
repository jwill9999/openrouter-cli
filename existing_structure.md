# OpenRouter CLI — Existing Structure

This document summarizes the current architecture, modules, and flows of the project as of this commit.

## Overview

- Language/Module: TypeScript (ESM) targeting Node.js >= 18.17.
- Entry: `src/index.ts` invokes `main()` from `src/main.ts`.
- CLI: Commander-based commands: `config`, `test`, `ask`, `repl`, `init`.
- Build: `npm run build` compiles to `dist/**`; runtime binary `bin/openrouter` loads `dist/index.js`.
- Tests: Vitest in `tests/*.spec.ts`; no network; I/O is mocked where needed.

```
bin/openrouter ─▶ dist/index.js (built)
src/index.ts ─▶ src/main.ts ─▶ commands
                               ├─ src/shared/openrouter.ts  (API, streaming)
                               ├─ src/shared/format.ts      (markdown→ANSI small)
                               ├─ src/shared/config.ts      (global/project config, profiles)
                               ├─ src/shared/env.ts         (defaults, api key helpers)
                               ├─ src/shared/auth.ts        (ensureApiKey + init fallback)
                               ├─ src/shared/init.ts        (interactive wizard)
                               └─ src/repl.ts               (interactive chat)
```

## Commands and Control Flow

- `config`
  - Shows or updates API key. Profile-aware via `--profile` and `--list`.
  - Domain/model edits are intentionally kept out of `config` (managed via `init`).

- `test`
  - Verifies connectivity via `GET /models` using `testConnection()`.
  - Resolves effective config and optionally triggers `init` when missing keys and running in TTY.

- `ask`
  - One-shot completion via `POST /chat/completions`.
  - Streaming default; `--no-stream` path renders full answer then prints styled header/footer.
  - Output format: `auto|plain|md` mapped by `src/shared/format.ts`.

- `repl`
  - Interactive session; supports `/model`, `/system`, `/format`, `/stream` commands.
  - Streams by default; non-stream reuses `askOnce` + renderer.

- `init`
  - Interactive wizard to pick provider/domain/model and optionally persist API key.
  - Tests connection before saving; writes to base config or a named profile.

## Configuration & Precedence

- Global file: `~/.config/openrouter-cli/config.json` (chmod `600` best-effort).
- Profiles: stored under `profiles` inside the same JSON file.
- Project overrides: `.openrouterrc(.json|.yaml|.yml)` in CWD.
- Precedence for `resolveConfig(profile?)`: project RC > named profile > global base.
- API key lookup: `OPENROUTER_API_KEY` or `OPENAI_API_KEY` envs take priority over persisted key.
- `maskKey()` redacts logged keys; code avoids printing secrets.

## Networking Layer (`src/shared/openrouter.ts`)

- `testConnection({ domain, apiKey })`: GET `/models`, returns JSON or throws on non-OK with body.
- `askOnce(opts, messages)`: POST `/chat/completions`, `stream:false`; returns assistant text.
- `streamChat(opts, messages)`: same endpoint with `stream:true`; reads SSE and writes deltas to stdout.
- `joinUrl(base, path)`: safe URL join preserving base path.
- `safeJson(res)`: tries JSON, falls back to text.

Notes:

- Request-level timeouts and normalized error mapping are not yet implemented (planned in upcoming tasks).

## Rendering & UI

- Markdown renderer: `src/shared/format.ts`
  - Minimal ANSI formatting for headings, lists, inline code; streaming path stays plain for responsiveness.
- Theming/UI: `src/shared/ui.ts`
  - Color detection: honors `NO_COLOR` and only colors when `process.stdout.isTTY` is true.
  - Palette: accent, ok/warn/err, dim, bold (chalk-backed but safe without colors).
  - Components: banner, examples box (help), non-stream answer header/footer, REPL prompt and tips box.
  - Commander help: `attachStyledHelp(program)` injects banner/examples via `addHelpText('beforeAll', ...)`.

## Security

- API keys are never logged; persisted config is written with `chmod 600` when possible.
- Prefer environment variables for ephemeral keys; `openrouter config --api-key` persists only when desired.

## Testing

- Vitest specs under `tests/` cover:
  - Config precedence and YAML rc handling.
  - URL join behavior.
  - Streaming SSE parsing and non-stream error propagation.
  - CLI help shape and basic styled help presence.
  - Redaction behaviors and minimal UI blocks.

## Build, Lint, and Scripts

- Build: `npm run build` → `dist/**`
- Dev (TS directly): `npm run dev -- <cmd>` (uses ts-node ESM loader).
- Tests: `npm test`; coverage: `npm run test:coverage`.
- Lint: `npm run lint` (flat config `eslint.config.js`).
- Packaging: `prepack` builds and runs `scripts/prepack.mjs`.

## Dependencies (runtime)

- `commander` (CLI), `js-yaml` (project rc YAML), `chalk` and `boxen` (UI), `cli-table3`, `ora` (available for future spinners/tables).

## Open Items / Upcoming Work

- Timeouts and normalized error handling for network requests.
- Non-interactive flags for `init` (provider/domain/model/api-key/profile) as part of CI flows.
- Documentation polish (README examples, REPL transcript, small screencast).
- Optional CI packaging and coverage upload.
