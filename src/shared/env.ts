import type { CliConfig } from "./config.js";

export function getDefaultConfig() {
  return {
    domain: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.1-8b-instruct",
  } as const;
}

export function getApiKey(cfg: CliConfig): string | undefined {
  const fromEnv = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  return fromEnv || cfg.apiKey;
}

export function maskKey(key: string) {
  if (!key) return key;
  if (key.length <= 8) return "*".repeat(key.length);
  return key.slice(0, 4) + "****" + key.slice(-4);
}

