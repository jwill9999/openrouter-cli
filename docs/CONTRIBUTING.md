# Contributing

This project uses Conventional Commits and semantic‑release. Releases are automated from `main`; prereleases publish from feature branches.

Basics
- Write descriptive, minimal PRs that include a brief summary, usage examples, and updated docs when behavior changes.
- Follow Conventional Commits (e.g., `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`, `test: ...`). Use scopes when helpful: `feat(config): ...`.

Local workflow
- Install deps: `npm install`
- Lint: `npm run lint`
- Test: `npm test`
- Build: `npm run build`
- Guided commit: `npm run commit`
- Optional hooks: `npm run dev:hooks` to install Husky locally
  - commit‑msg: commitlint
  - pre‑commit: lint‑staged (ESLint fix on staged files)
  - pre‑push: tests + build

Tooling tips
- If tests fail in a restricted shell due to worker/thread sandboxing, run them in CI or a normal local shell (where Vitest can spawn workers). CI is the source of truth.
- If `npm pack --dry-run` fails due to cache permissions, use the local cache script: `npm run pack:dry` (sets `--cache ./.npm-cache`). To fix your user cache permanently, run: `sudo chown -R $(id -u):$(id -g) ~/.npm`.

CI/Release
- CI runs build, lint, and tests on Node 18.x and 20.x.
- Release workflow uses semantic‑release with provenance enabled.
