import readline from 'node:readline';
import { updateConfig, updateProfile } from './config.js';
import type { CliConfig } from './config.js';
import { getDefaultConfig } from './env.js';
import { testConnection } from './openrouter.js';
import { fetchModelsCached, fuzzyIds } from './models.js';
import { banner } from './ui.js';

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

  if (process.stdout.isTTY) console.log(banner());
  const provider: Provider = 'openrouter';
  const preset = choosePreset(provider);

  const domain = (await ask(`API domain (default: ${preset.domain || 'none'}): `)) || preset.domain;
  let model = (await ask(`Default model (default: ${preset.model || 'none'}): `)) || preset.model;

  let apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
  if (!apiKey) {
    apiKey = await askHidden('API key (leave blank to skip): ');
  }

  const profile = await ask('Profile name (optional): ');

  // Interactive model picker (TTY only)
  if (process.stdout.isTTY) {
    try {
      const enq = await import('enquirer');
      const promptFn: any = (enq as any).prompt ?? (enq as any).default?.prompt;
      if (typeof promptFn !== 'function') throw new Error('Enquirer prompt() not available');
      // Preload models list (best-effort)
      let initial: string[] = [model || getDefaultConfig().model];
      let modelsList: Array<{ id: string; name?: string }> = [];
      try {
        const list = await fetchModelsCached({ domain, apiKey: apiKey || undefined });
        modelsList = list;
        initial = list.slice(0, 25).map(m => m.id);
      } catch {}
      const stableSuggest = async (input: string) => {
        const q = input || '';
        const ids = modelsList.length ? fuzzyIds(q, modelsList as any) : [] as string[];
        const withTyped = q && !ids.includes(q) ? [q, ...ids] : ids;
        return toChoices(withTyped.length ? withTyped : initial);
      };
      const toChoices = (ids: string[]) => ids.map(id => ({ name: id, value: id, message: id }));
      const ans = await promptFn({
        type: 'autocomplete',
        name: 'model',
        message: 'Choose a model (type to fuzzy search)',
        limit: 10,
        initial: 0,
        choices: toChoices(initial),
        suggest: stableSuggest,
      });
      if ((ans as { model?: string })?.model) model = (ans as { model?: string }).model as string;
      const confirm = await promptFn({
        type: 'confirm',
        name: 'save',
        message: `Set '${model}' as default model?`,
      });
      const confirmSave: boolean = !!(confirm as { save?: boolean }).save;
      if (!confirmSave) {
        // keep previously entered model value
      }
    } catch {
      // Non-fatal: continue with current model
    }
  }

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
