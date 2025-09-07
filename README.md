# openrouter-cli

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org)
[![semantic-release](https://img.shields.io/badge/semantic--release-automated-green?logo=semantic-release)](https://semantic-release.gitbook.io)
[![npm (beta)](https://img.shields.io/npm/v/%40letuscode%2Fopenrouter-cli/beta)](https://www.npmjs.com/package/@letuscode/openrouter-cli)

Releases are automated: Conventional Commits determine version bumps and semantic-release publishes stable builds from `main` and prereleases on the `beta` channel from dev branches. Use `npm run commit` for a guided, standards-compliant commit message.

CLI tool for OpenRouter (OpenAI-compatible). Early v0.1.0 skeleton.

Installation
- npm: `npm i -g @letuscode/openrouter-cli` (or run locally with `npx @letuscode/openrouter-cli`)

Setup
- Set API key via env: `export OPENROUTER_API_KEY=...` (or `OPENAI_API_KEY`)
- Or persist it: `openrouter config --api-key sk-...`

Defaults
- Domain: `https://openrouter.ai/api/v1`
- Model: `meta-llama/llama-3.1-8b-instruct`

Commands
- `openrouter config [--domain URL] [--model NAME] [--api-key KEY]`
- `openrouter test` — calls `/models` to verify connectivity
- `openrouter ask "your question" [-m MODEL] [-s SYSTEM] [--no-stream]`
- `openrouter repl` — interactive chat (streaming). Commands: `exit`, `/model`, `/system`

Config
- Stored at `~/.config/openrouter-cli/config.json` with chmod 600 when possible.
- API keys are never logged; printed configs redact the key.

Publishing
Stable releases (main)
- Conventional Commits drive versioning via semantic-release.
- Merge to `main` with `feat`, `fix`, or `BREAKING CHANGE` commits triggers release:
  - Publishes to npm with the next semver.
  - Creates Git tag (`vX.Y.Z`) and GitHub Release.

Pre-releases
- Beta snapshots publish from dev branches (`story/**`, `feature/**`, `release/**`).
- Install beta builds: `npm i @letuscode/openrouter-cli@beta`
- Driven by commit messages; semver prerelease scheme.
- Beta builds are npm-only; stable tags are created on `main`.

Contributing
- Commit style: Conventional Commits (e.g., `feat: add repl /help`, `fix: handle URL join`) drive releases.
- Local hooks (Husky):
  - commit-msg: commitlint enforces Conventional Commits.
  - pre-commit: lint-staged runs ESLint with `--fix` on staged files.
  - pre-push: runs `npm test` and `npm run build`.
- Setup: run `npm install` once to install hooks (postinstall runs `husky install`).
- Manual runs:
  - `npx commitlint --from HEAD~1 --to HEAD` (check last commit)
  - `npx lint-staged` (run staged linting)
  - `npm run lint && npm test && npm run build`

Conventional Commits examples
- `feat: add config command to update model`
- `fix: preserve /api/v1 path when joining URLs`
- `docs: add contributing section`
- `chore: set up semantic-release`
- `refactor: extract URL join helper`
- `perf: speed up SSE parsing`
- `test: add URL join tests`
- `feat!: change default model` with a footer:
  - `BREAKING CHANGE: default model is now meta-llama/llama-3.1-8b-instruct`

Guided commit (Commitizen)
- Run `npm run commit` for an interactive prompt that produces a valid Conventional Commit message.

License
- MIT
