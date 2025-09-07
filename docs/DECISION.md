# OpenRouter CLI — Decision Log

This document tracks major design choices, scope, and phased roadmap for the **openrouter-cli** project.

---

## Iteration 1 (v0.1.x)

### Scope
- npm-first TypeScript CLI (alias: `openrouter`).
- Global config at `~/.config/openrouter-cli/config.json` (no project-local rc yet).
- Defaults:
  - `domain = https://openrouter.ai/api/v1`
  - `model = meta-llama/llama-3.1-8b-instruct`
- Features:
  - Domain switching via `openrouter config --domain …`
  - Model update via `openrouter config --model …`
  - API key from env (`OPENROUTER_API_KEY` / `OPENAI_API_KEY`) or persisted config
  - Connection check (`openrouter test` → `/models`)
  - Interactive REPL with streaming, commands:
    - `exit`
    - `/model`
    - `/system`
  - One-shot `openrouter ask` command

### Security
- Never log API keys.
- Config file chmod 600 where possible.

### Out of Scope (queued for later)
- Project-local `.openrouterrc` overrides.
- Profiles (e.g. `--profile dev`).
- Additional backends (Ollama, OpenAI, Anthropic) via `--domain` or `--backend`.
- Enhanced REPL (`/help`, `/save`, `/load`).
- Keychain storage.
- Packaging expansion (Homebrew, winget, PyPI).

### Rationale
- Optimize for frictionless `npm i -g` and `npx` demos for Node-first users.
- Stay provider-agnostic via OpenAI-compatible API and configurable domain.
- Ship streaming UX and exit semantics early for smooth demos.

### Next Checkpoints
- Wire skeleton code into repo and basic CI (build + lint + test). ✅ Completed
- Release automation: adopt semantic-release with Conventional Commits. ✅ Completed
- Release from `main` via CI (no manual tagging). ✅ Completed (shipped as `v1.0.0`)
- Plan Iteration 2: `.openrouterrc` & profiles. ✅ Completed

### Acceptance (Completed as v1.0.0)
- All scope items delivered (CLI, config, defaults, `config`/`test`/`ask`/`repl` with streaming, API key handling).
- Security constraints honored (no key logging; best‑effort chmod 600).
- CI in place (build, lint, test) and production release automation configured.
- Version note: initial stable was published as `v1.0.0` (commit history included a breaking change). We accept this as Iteration 1’s shipped version; no reversioning planned.

---

## Extension Roadmap

### Phase 1 — Tool Plugins (Manual Mode)
- Local tool discovery:
  - `~/.config/openrouter-cli/tools.d/*.js`
  - `./.openrouter/tools/*.js`
  - npm packages with prefix `@openrouter-cli-tool-*`
- CLI UX:
  - `openrouter tools list`
  - `openrouter tools run <name> --args '{"..."}'`
- REPL:
  - `/tools`
  - `/use <name> <jsonArgs>`
  - `/help`
- Config: support tool paths in global config (project overrides come later).
- Security:
  - Explicit allowlist.
  - Capability flags (net/fs/exec) default off.
  - Redact secrets.
- Testing: manifest validation, sandboxed E2E.
- Deliverable: starter tool `web.search` (DuckDuckGo, no key).

### Phase 2 — Tool Calling (Auto Mode)
- Expose tools as OpenAI-compatible `tools` (function-calling) in chat requests.
- On `tool_call`, execute plugin and loop response as `tool` message.
- Modes: `--tools off|manual|auto` (default manual).
- Fallback to manual if provider/model lacks tool support.
- Evidence logging (opt-in) for compliance.

### Phase 3 — MCP Client Integration
- Minimal MCP client (stdio first; WS/HTTP later).
- Config:
  - `~/.config/openrouter-cli/mcp.d/*.json`
  - optional project `./.openrouter/mcp.d/*.json`
- CLI UX:
  - `openrouter mcp ls`
  - `openrouter mcp run <server.tool> --args '{"..."}'`
- REPL:
  - `/mcp`
  - `/use <server.tool> {...}`
- Optional: expose MCP tools as model `tools` when auto mode enabled.
- Supervisor: restart-on-crash, per-server env/cwd.
- Testing: fake MCP server fixture; discovery + invocation contract tests.

---

## Cross-Cutting Later Items
- `.openrouterrc` project overrides & profiles.
- Keychain-backed secret storage (macOS/Win/gnome-keyring).
- Enhanced packaging:
  - Homebrew
  - winget
  - single-file binaries (`pkg`).

---


### Release Process (v0.1.x)
- Releasing
  - Stable releases occur on `main` via semantic-release. Conventional Commits decide bump.
  - Git tags (`vX.Y.Z`) and GitHub Releases are created by CI; npm publish is automated.
- Pre-releases
  - Dev branches (`story/**`, `feature/**`, `release/**`) publish prereleases to npm with `beta` dist-tag.
  - No repo tags are created for prereleases.
- Developer Experience
  - commitlint + Conventional Commits enforced in PR and via local Husky hooks.
  - ESLint on staged files pre-commit; tests pre-push.


## Iteration 2 (v0.2.0) — Plan

### Scope
- Project-local `.openrouterrc` overrides.
- Profiles (e.g. `--profile dev`) with per-profile domain/model/system overrides.

### Design
- Config precedence:
  - CLI flags > env vars > project `.openrouterrc` > global config.
- Files:
  - Global: `~/.config/openrouter-cli/config.json` (existing)
  - Project: `./.openrouterrc` (JSON or YAML; v0.2: JSON only)
- Profiles:
  - Specify via `--profile <name>` on CLI and REPL.
  - Global and project configs can define `profiles` object; missing keys fall back to base config.

### CLI/UX
- Add `--profile` to `ask`, `repl`, and `test`.
- `config` command: support reading/writing base values only in v0.2; profiles are read-only initially.

### Security
- Same key-handling guarantees; never log secrets.
- Project file is not created automatically; only read if present.

### Tasks
- Implement loader for `.openrouterrc` with merge logic and precedence. ✅ Completed
- Add profile resolver with fallback. ✅ Completed
- Update help/docs and examples. ✅ Completed
- Add unit tests for precedence and profiles. ⏳ Partial (URL join test added; profile tests next)

### Out of Scope for v0.2
- YAML/TOML formats, keychain storage, remote profiles.
