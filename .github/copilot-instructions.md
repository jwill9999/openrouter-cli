# Copilot Instructions for openrouter-cli

## Big Picture Architecture

<overview>
- This is a TypeScript CLI tool for OpenRouter (OpenAI-compatible), supporting config management, chat, and REPL.
- Main entry: `src/main.ts` (uses Commander for CLI commands).
- Core modules:
  - `src/shared/config.ts`: config file management, profile support, project-local overrides.
  - `src/shared/env.ts`: environment variable helpers, API key masking.
  - `src/shared/openrouter.ts`: API calls, chat logic.
  - `src/repl.ts`: interactive chat REPL.
</overview>

## Configuration & Profiles

<configuration>
- Config precedence: CLI flags > env vars > `.openrouterrc` (JSON/YAML) > global config (`~/.config/openrouter-cli/config.json`) > defaults.
- API keys: Prefer `OPENROUTER_API_KEY` or `OPENAI_API_KEY` env vars.
- Project-local overrides: `.openrouterrc` in root (JSON/YAML).
- Named profiles: stored in global config, selected via `--profile`.
</configuration>

## Developer Workflows

<commands>
- **Build:** `npm run build` (TypeScript → dist)
- **Test:** `npm test` (Vitest), `npm run test:watch` for watch mode.
- **Lint:** `npm run lint` (ESLint), auto-fix staged files via lint-staged.
- **Commit:** Use Conventional Commits. Run `npm run commit` for guided commit (Commitizen).
- **Release:** Automated via semantic-release. Merges to `main` with valid commit messages trigger npm publish and GitHub release.
- **Hooks:** Husky enforces commitlint, lint-staged, and pre-push tests/build.
</commands>

## Conventions & Patterns

<conventions>
- All commits must follow Conventional Commits (enforced by commitlint).
- Config files and API keys are never logged; keys are redacted.
- All config changes and profile updates go through CLI commands.
- External dependencies: `commander`, `js-yaml`, `vitest`, `eslint`, `semantic-release`, `commitlint`, `husky`, `lint-staged`.
</conventions>

## Integration Points

<Integrations>
- NPM publishing: stable from `main`, beta from dev branches.
- CI/CD: semantic-release, CHANGELOG generated in CI (not committed).
- API: interacts with OpenRouter-compatible endpoints.
</Integrations>

## Key Files

<structure>
- `src/main.ts`: CLI entry, command definitions.
- `src/shared/config.ts`: config/profile logic.
- `docs/CONFIGURATION.md`: config and profile documentation.
- `.openrouterrc`: project-local config example.
- `package.json`: scripts, dependencies, lint-staged, commitizen config.
</structure>
