import { readConfig, resolveConfig } from './config.js';
import { getApiKey } from './env.js';
import { runInitWizard } from './init.js';

export type EnsureApiKeyResult = { ok: true; apiKey: string } | { ok: false; message: string };

const MISSING_KEY_MSG = "Missing API key. Set OPENROUTER_API_KEY / OPENAI_API_KEY or run 'openrouter init'.";

export async function ensureApiKey(profile?: string, allowInit?: boolean): Promise<EnsureApiKeyResult> {
  const eff = await resolveConfig(profile);
  let apiKey = getApiKey(await readConfig()) || eff.apiKey;

  if (!apiKey && process.stdout.isTTY && allowInit !== false) {
    const ok = await runInitWizard();
    if (ok) {
      const refreshed = await resolveConfig(profile);
      apiKey = getApiKey(await readConfig()) || refreshed.apiKey;
    }
  }

  if (!apiKey) return { ok: false, message: MISSING_KEY_MSG };
  return { ok: true, apiKey };
}

