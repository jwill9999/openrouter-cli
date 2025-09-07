# openrouter-cli

CLI tool for OpenRouter (OpenAI-compatible). Early v0.1.0 skeleton.

Installation
- npm: `npm i -g openrouter-cli` (or run locally with `npx openrouter-cli`)

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

License
- MIT
