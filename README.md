# openrouter-cli

OpenAI‑compatible CLI for OpenRouter. Ask questions, run a REPL, and manage per‑project or global settings.

Requirements
- Node.js 18.17+ (ESM)

Install
- Global: `npm i -g @letuscode/openrouter-cli`
- One‑off: `npx @letuscode/openrouter-cli --help`

Quick start
1) Run the wizard: `openrouter init` (select provider, set domain/model, and add an API key)
2) Ask something: `openrouter ask --no-stream "Hello!"`
3) Chat interactively: `openrouter repl`

Core commands
- `openrouter init` — interactive setup (provider, domain, key, model, profile)
- `openrouter config` — view config or set API key
  - Examples:
    - `openrouter config --list`
    - `openrouter config --api-key sk-...` (stores in base config)
    - `openrouter config --profile dev --api-key sk-...` (stores in profile)
- `openrouter test` — verify connectivity (`/models`)
  - `openrouter test [--profile dev] [--no-init]`
- `openrouter ask` — one‑shot prompt
  - `openrouter ask "your question" [-s SYSTEM] [--format auto|plain|md] [--profile NAME] [--no-stream] [--no-init]`
- `openrouter repl` — interactive chat
  - REPL commands: `exit`, `/model <name>`, `/system <text>`, `/format md|plain`, `/stream on|off`

Configuration
- API key via env (recommended): `export OPENROUTER_API_KEY=...` (or `OPENAI_API_KEY`)
- Global config file: `~/.config/openrouter-cli/config.json` (chmod 600 where possible; keys never logged)
- Project overrides: add `.openrouterrc` (JSON or YAML) in your project root
  - Example `.openrouterrc` (JSON):
    {
      "domain": "http://localhost:11434/v1",
      "model": "gemma2:9b-instruct"
    }
- Changing default provider, domain, or model: re‑run `openrouter init` (this is the only way to update these defaults).
- More details: see `docs/CONFIGURATION.md`.

Troubleshooting
- “Missing API key”: set `OPENROUTER_API_KEY` or run `openrouter init` (or `openrouter config --api-key sk-...`).
- Non‑TTY/CI: pass `--no-init` to skip interactive prompts.

License
- MIT
