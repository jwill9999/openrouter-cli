import { Command } from 'commander';
import { banner, palette } from '../shared/ui.js';
import { resolveConfig } from '../shared/config.js';
import { getDefaultConfig } from '../shared/env.js';
import { fetchModelsCached, fuzzyIds} from '../shared/models.js';
import Table from 'cli-table3';

export function registerModelsCommand(program: Command) {
  program
    .command('models')
    .argument('[query]', 'Search term')
    .description('Search OpenRouter models')
    .option('--non-interactive', 'Disable prompts')
    .action(async (query: string | undefined, opts: { nonInteractive?: boolean }) => {
      const eff = await resolveConfig();
      const domain = eff.domain || getDefaultConfig().domain;
      const apiKey = eff.apiKey; // do not print

      const interactive = process.stdin.isTTY && process.stdout.isTTY && !opts.nonInteractive && !query;
      if (interactive) {
        try {
          console.log(banner());
          const enq = await import('enquirer');
          const promptFn: any = (enq as any).prompt ?? (enq as any).default?.prompt;
          if (typeof promptFn !== 'function') throw new Error('Enquirer prompt() not available');
          let initial: string[] = [eff.model || getDefaultConfig().model];
          let modelsList: Array<{ id: string; name?: string }> = [];
          try {
            const list = await fetchModelsCached({ domain, apiKey });
            modelsList = list;
            initial = list.slice(0, 25).map(m => m.id);
          } catch {}
          const stableSuggest = async (input: string) => {
            const q = input || '';
            const ids = modelsList.length ? fuzzyIds(q, modelsList) : [];
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
          const picked: string = (ans as { model: string }).model;
          process.stdout.write(palette.ok(`Selected: ${picked}`) + '\n');
          return;
        } catch (e) {
          if (process.env.ORCLI_DEBUG) {
            console.error('interactive fallback:', e);
          }
          console.log('fall through to non-interactive table print');
        }
      }

      try {
        const list = await fetchModelsCached({ domain, apiKey });
        const ids = fuzzyIds(query || '', list, 25);
        const table = new Table({ head: ['ID', 'Name'] });
        for (const id of ids) {
          const meta = list.find(m => m.id === id);
          table.push([id, meta?.name || '']);
        }
        console.log(table.toString());
      } catch (e) {
        const table = new Table({ head: ['ID', 'Name'] });
        const fallback = eff.model || getDefaultConfig().model || 'openrouter/auto';
        table.push([fallback, '']);
        console.log(table.toString());
      }
    });
}
