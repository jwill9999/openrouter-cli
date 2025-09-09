# OpenRouter CLI — Tomorrow’s Plan (Iteration 2 follow‑ups)

This document outlines the concrete tasks to implement next, with scope, UX, acceptance criteria, and test notes.

## 1) Patch Release (installation + bin)

Goal: End users can install and run without any flags or permission issues.

Tasks
- Verify package.json has no consumer lifecycle hooks (prepare/postinstall) invoking Husky. Keep dev-only `dev:hooks` for contributors.
- Ship executable wrapper `bin/openrouter` with shebang; ensure `prepack` sets `chmod +x` and includes `bin/**` in `files`.
- Publish a patch release (e.g., 1.2.x) from `main`.

Acceptance
- `npm i -g @letuscode/openrouter-cli` installs without `--ignore-scripts`.
- `openrouter --help` works on a clean machine.
- `npx @letuscode/openrouter-cli --help` works.

Validation
- Manual install test on a fresh Node env.
- CI release job green.

## 2) Markdown Rendering in CLI

Goal: Render Markdown answers nicely in the terminal for non-streamed output; keep streaming responsive.

UX
- `--format auto|plain|md` (default: auto → md for non-stream; plain for stream).
- REPL commands: `/format md|plain`, `/stream on|off`.
- Non-stream path (askOnce): pretty-print markdown → ANSI.
- Stream path: default plain; optional buffer+render later (not MVP).

Implementation
- Add `src/shared/format.ts` using a lightweight renderer (e.g., `marked` + `marked-terminal` or `markdown-it` + ANSI styling).
- Wire in `ask` non-stream path; REPL respects current format/stream settings.

Acceptance
- `openrouter ask --no-stream "# Title\n\n- item\n\n\`code\``" shows headings/lists/code with ANSI styling.
- REPL: `/format md` + `/stream off` then ask → renders pretty once.

Tests
- Unit: markdown → ANSI smoke snapshots (minimal).
- E2E (optional): CLI with `--no-stream` returns colored output (strip ANSI to assert structure).

Docs
- README: document `--format` and REPL commands.

## 3) Interactive Onboarding (init)

Goal: First-time setup wizard to configure provider, domain, API key, model (and optional profile) interactively.

UX
- New command: `openrouter init` (TTY prompts).
- Auto-prompt in `ask/test/repl` if missing API key and in a TTY; skip with `--no-init`.
- Steps:
  1) Provider preset: OpenRouter | OpenAI | Claude (via OpenRouter) | Custom
  2) Domain from preset (editable)
  3) API key (masked input). Note env alternatives.
  4) Default model (suggest from preset)
  5) Optional profile name (default: `default`)
  6) Validate (attempt `/models` when possible), then save (chmod 600), never echo key.

Provider Presets (MVP)
- OpenRouter: domain `https://openrouter.ai/api/v1`, env `OPENROUTER_API_KEY`, model `meta-llama/llama-3.1-8b-instruct`.
- OpenAI: domain `https://api.openai.com/v1`, env `OPENAI_API_KEY`, model `gpt-4o-mini` (example).
- Claude (MVP via OpenRouter): recommend selecting OpenRouter provider and choosing a Claude model there. Direct Anthropic support planned later.
- Custom: enter domain/env guidance; user supplies model.

Implementation
- Add `prompts` or `enquirer` as a dep for TTY prompts.
- Extend config schema with optional `provider` field.
- Add `openrouter config --provider <openrouter|openai|claude|custom>` to apply preset quickly.
- Respect `--no-init` global option to skip prompting.

Acceptance
- Running `openrouter init` writes config and profiles as chosen; subsequent `openrouter test` succeeds (with valid key).
- First-run `openrouter ask` with no key triggers wizard in interactive shells and skips in CI/non-TTY.

Tests
- Non-interactive init path (with flags) writes expected config.
- Preset mapping test: provider → domain/env name/model defaults.

Docs
- README: “Getting Started” using `openrouter init`.
- CONFIGURATION.md: provider presets and env vars.

## 4) Additional Tests

- Config precedence with YAML `.openrouterrc` (project > profile > global).
- `config --list` output shape (keys redacted).
- Optional: timeout + error formatting (once implemented).

## 5) CI and Release Polishing

- Ensure release job env includes `NPM_CONFIG_PROVENANCE=true` (stable provenance).
- Beta workflow already skips duplicate versions; keep as-is for now.
- Optional: run build/lint/test gates before beta publish.

---

## Command Reference (new/changed)

- `openrouter init` — interactive first-time setup (provider, domain, key, model, profile)
- `openrouter ask --format auto|plain|md` — output formatting
- `openrouter repl` commands: `/format md|plain`, `/stream on|off`
- `openrouter config --provider <name>` — apply provider preset

## Out of Scope (for tomorrow)

- Direct Anthropic client (Claude) integration.
- Streaming markdown reflow (advanced buffering/live formatting).
- Tool plugins / MCP phases from roadmap.

