import readline from 'node:readline';
import { updateConfig, updateProfile } from './config.js';
import type { CliConfig } from './config.js';
import { getDefaultConfig } from './env.js';
import { testConnection } from './openrouter.js';

type Provider = 'openrouter' | 'openai' | 'custom';

function choosePreset(p: Provider) {
  if (p === 'openai') return { provider: 'openai' as const, domain: 'https://api.openai.com/v1', model: 'gpt-4o-mini' };
  if (p === 'custom') return { provider: 'custom' as const, domain: '', model: '' };
  // default: openrouter
  const d = getDefaultConfig();
  return { provider: 'openrouter' as const, domain: d.domain, model: d.model };
}

export async function runInitWizard(): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const ask = (q: string) => new Promise<string>((res) => rl.question(q, (ans) => res(ans.trim())));
  const askHidden = (q: string) => ask(q); // fallback: no masking in this environment

  console.log('=== OpenRouter CLI — Init ===');
  const provInput = (await ask('Provider [openrouter|openai|custom] (default: openrouter): ')) as Provider | '';
  const provider: Provider = (provInput === 'openai' || provInput === 'custom') ? provInput : 'openrouter';
  const preset = choosePreset(provider);

  const domain = (await ask(`API domain (default: ${preset.domain || 'none'}): `)) || preset.domain;
  const model = (await ask(`Default model (default: ${preset.model || 'none'}): `)) || preset.model;

  let apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
  if (!apiKey) {
    apiKey = await askHidden('API key (leave blank to skip): ');
  }

  const profile = await ask('Profile name (optional): ');

  let save = true;
  if (apiKey && domain) {
    try {
      await testConnection({ domain, apiKey });
      console.log('✓ Connection OK');
    } catch (e) {
      console.log('! Connection failed:', e instanceof Error ? e.message : String(e));
      const ans = (await ask('Save settings anyway? [y/N]: ')).toLowerCase();
      save = ans === 'y' || ans === 'yes';
    }
  }

  if (save) {
    // Persist selections. If a profile is provided, write under that profile; otherwise write to base config.
    const changes: Partial<CliConfig> = { provider, domain: domain || undefined, model: model || undefined };
    if (apiKey) changes.apiKey = apiKey;
    if (profile) {
      await updateProfile(profile, changes);
      console.log(`Saved to profile '${profile}' in ~/.config/openrouter-cli/config.json`);
    } else {
      await updateConfig(changes);
      console.log('Saved to base config at ~/.config/openrouter-cli/config.json');
    }
  } else {
    console.log('Nothing saved.');
  }

  rl.close();
  return save;
}
