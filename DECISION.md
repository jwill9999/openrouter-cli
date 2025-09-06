# OpenRouter CLI — Decision Log

This document tracks major design choices, scope, and phased roadmap for the **openrouter-cli** project.

---

## Iteration 1 (v0.1.0)

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
- Wire skeleton code into repo and basic CI (build + lint + test).
- Tag `v0.1.0` and publish to npm.
- Plan Iteration 2: `.openrouterrc` & profiles.

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



