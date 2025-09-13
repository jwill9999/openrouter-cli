# Next TODOs (Iteration Planning)

## Top Priority — CLI Visual Polish

- [ ] Discuss desired look/feel (Claude/Codex‑style): banner/logo, colors, spacing.
- [ ] Pick libraries: `chalk` (colors), `boxen` (frames), `gradient-string` (optional), `ora` (spinners), `table`/`cli-table3` (tabular output).
- [ ] Optional image/avatar in terminal (TTY only): evaluate `terminal-image` with fallback to ASCII art.
- [ ] Apply consistent style to `--help`, `ask` (non‑stream output), `repl` prompts and tips.
- [ ] Accessibility: color‑safe palette, no-color fallback via `NO_COLOR`/TTY detection.

## Tests & Coverage

- [ ] Add coverage thresholds in Vitest (start: 70% lines/branches; raise gradually).
- [ ] Add tests:
  - [ ] ask (non‑stream) markdown snapshot (ANSI stripped before assert).
  - [ ] Auto‑init skip in non‑TTY (mock isTTY and stub wizard).
  - [ ] testConnection error mapping (HTTP 4xx/5xx → friendly messages).
  - [ ] REPL non‑stream render path snapshot (strip ANSI).
  - [ ] Optional: CLI E2E smoke (pack → run `--help`) in CI artifact.

## Error Handling & Timeouts

- [ ] Add request timeout to fetch and surface timeouts clearly.
- [ ] Normalize error output (network/DNS/401/429) with concise guidance.

## Init Flow Polish

- [ ] Improve prompts copy; add final summary/confirm before save.
- [ ] Consider non‑interactive flags for automation: `init --provider --domain --model --api-key --profile`.
- [ ] Keep domain/model changes only via `init` (docs reflect this).

## Docs

- [ ] README: add short, copy‑paste examples (ask md render, brief REPL transcript).
- [ ] Consider a small GIF/screencast once UI polish lands.

## CI & Packaging

- [ ] Upload coverage (e.g., Codecov) [optional].
- [ ] Attach `npm pack --dry-run` tarball as CI artifact for review.

## Open Questions (to discuss)

- [ ] Keep `.openrouterrc` project overrides long‑term or simplify later?
- [ ] Image/avatar in terminal: ship ASCII art only, or inline images when supported?
- [ ] Non‑interactive `init` flags: needed now for CI/scripts?
