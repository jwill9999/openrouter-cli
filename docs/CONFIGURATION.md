# OpenRouter CLI — Configuration & Profiles

This guide explains how configuration works in the CLI, how to set API keys securely, and how to use project‑local overrides and named profiles.

## Overview

Configuration comes from multiple sources. At runtime, values are resolved using this precedence (highest → lowest):

1. CLI flags (e.g., `--profile`, `-m/--model`, `--domain`)
2. Environment variables (API key: `OPENROUTER_API_KEY` or `OPENAI_API_KEY`)
3. Project `.openrouterrc` (JSON or YAML in your project root)
4. Global profile (`profiles.<name>` in `~/.config/openrouter-cli/config.json`)
5. Global base config (`~/.config/openrouter-cli/config.json`)
6. Built‑in defaults

Defaults:

- Domain: `https://openrouter.ai/api/v1`
- Model: `meta-llama/llama-3.1-8b-instruct`

Interactive onboarding:

- Run `openrouter init` to select a provider preset, set domain/model, and (optionally) persist an API key. Commands like `ask`, `test`, and `repl` auto‑prompt on missing keys in TTY unless `--no-init` is provided.

## Global Config

- Path: `~/.config/openrouter-cli/config.json`
- Stores base values and optional `profiles` object.
- Example:

```json
{
  "domain": "https://openrouter.ai/api/v1",
  "model": "meta-llama/llama-3.1-8b-instruct",
  "profiles": {
    "dev": {
      "domain": "http://localhost:11434/v1",
      "model": "gemma2:9b-instruct"
    }
  }
}
```

- Permissions: written with chmod 600 where possible. Keys are redacted when printed.

### Managing Global Config via CLI

- Persist an API key (optional):
  - Global: `openrouter config --api-key sk-...`
  - Profile: `openrouter config --profile dev --api-key sk-...`
- Inspect config and profiles (redacted):
  - `openrouter config --list`

### Changing Provider, Domain, or Model

- Use `openrouter init` to choose or change provider, domain, and default model. Re‑run `init` any time to update these defaults.

## Project‑Local Overrides (.openrouterrc)

Place a `.openrouterrc` in your project root to set project‑specific defaults. This file should not contain secrets.

- JSON example (`./.openrouterrc` or `./.openrouterrc.json`):

```json
{
  "domain": "http://localhost:11434/v1",
  "model": "gemma2:9b-instruct"
}
```

- YAML example (`./.openrouterrc.yaml` or `.yml`):

```yaml
domain: http://localhost:11434/v1
model: gemma2:9b-instruct
```

Project overrides are merged on top of the selected profile (if any) and global base.

## Environment Variables (API Key)

Use an environment variable for your API key. This is the safest approach and avoids writing secrets to disk.

- Preferred: `OPENROUTER_API_KEY`
- Also supported: `OPENAI_API_KEY`

Examples:

- bash/zsh:
  - `export OPENROUTER_API_KEY=sk-...` (place in `~/.bashrc` or `~/.zshrc` to persist)
- fish:
  - `set -Ux OPENROUTER_API_KEY sk-...`
- PowerShell:
  - `$Env:OPENROUTER_API_KEY = 'sk-...'`

CI/CD: store the key as a secret and inject it into the job environment.

Auto‑init behavior

- In interactive terminals, `openrouter ask|test|repl` will trigger `openrouter init` if no API key is available. Pass `--no-init` to skip.

## CLI Flags (Per‑Command)

- Pick a profile for a command:
  - `openrouter test --profile dev`
  - `openrouter ask --profile dev "Hello world"`
  - `openrouter repl --profile dev`

Note: To change the default domain or model, re‑run `openrouter init`. Per‑invocation model overrides have been removed to keep usage simple.

## Putting It Together: Precedence

Example resolution for `openrouter ask --profile dev "Hi"` in a project with `.openrouterrc`:

- CLI flags: profile=dev (wins over all below)
- Env: API key from `OPENROUTER_API_KEY`, if set
- Project `.openrouterrc`: overrides domain/model for this project
- Global profile `profiles.dev`: used if not set in project
- Global base: fallback values
- Defaults: final fallback

## Security Best Practices

- Prefer environment variables for API keys. Avoid committing secrets.
- If you must persist keys, use `openrouter config --api-key` (global) or `--profile <name> --api-key` (profile). The config file is chmod 600 where possible and keys are never logged.
- Do not put secrets in `.openrouterrc`.

## Troubleshooting

- “Missing API key”
  - Set `OPENROUTER_API_KEY` or run `openrouter config --api-key sk-...`.
- “Profile not picked up”
  - Ensure you pass `--profile <name>` on the command or set the values in global base/project rc.
- “Project overrides not applied”
  - Verify `.openrouterrc` is in your project root. Supported names: `.openrouterrc`, `.openrouterrc.json`, `.openrouterrc.yaml`, `.openrouterrc.yml`.

## Quick Reference

- Create/update profile:
  - `openrouter config --profile dev --domain http://localhost:11434/v1 --model gemma2:9b-instruct`
- Show config:
  - `openrouter config --list`
- Use a profile:
  - `openrouter test --profile dev`
  - `openrouter ask --profile dev "Hello"`
- Project override file:
  - `./.openrouterrc` (JSON/YAML)
  - Tip: This is optional and best for users running the CLI inside a project directory. For global one‑off use, rely on `openrouter init` defaults.
- API key env vars:
  - `OPENROUTER_API_KEY` (preferred), `OPENAI_API_KEY`
- Run the wizard:
  - `openrouter init`
- Apply a provider preset:
  - `openrouter config --provider openrouter|openai|custom`
