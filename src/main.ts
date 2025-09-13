import { Command } from 'commander';
import {
  readConfig,
  updateConfig,
  ensureConfigDir,
  updateProfile,
  resolveConfig,
  resetConfig,
  overrideConfig,
} from './shared/config.js';
import type { CliConfig } from './shared/config.js';
import { getDefaultConfig, maskKey } from './shared/env.js';
import { testConnection, askOnce, ChatOptions, streamChat } from './shared/openrouter.js';
import { renderText, OutputFormat } from './shared/format.js';
import { startRepl } from './repl.js';
import { runInitWizard } from './shared/init.js';
import { attachStyledHelp, answerHeader, infoFooter, showSpinner } from './shared/ui.js';
import { isPolicyError, handlePolicyError } from './shared/errors.js';
import { registerModelsCommand } from './commands/models.js';

export function buildProgram() {
  const program = new Command();
  program.name('openrouter').description('OpenRouter CLI').version('0.1.0');

  // Attach styled help (banner + examples)
  attachStyledHelp(program);

  // Attach styled help (banner + examples)
  attachStyledHelp(program);

  program
    .command('config')
    .description('Show configuration or update API key')
    .option('--api-key <key>', 'Persist API key (use env for ephemeral)')
    .option('--profile <name>', 'Select profile to read/update (default: base)')
    .option('--list', 'List profiles and current base config')
    .option('--danger-reset', 'Danger: delete global config (debug)')
    .option('--override-json <json>', 'Danger: replace global config with JSON (debug)')
    .action(
      async (opts: {
        apiKey?: string;
        profile?: string;
        list?: boolean;
        dangerReset?: boolean;
        overrideJson?: string;
      }) => {
        await ensureConfigDir();
        if (opts.dangerReset) {
          await resetConfig();
        }
        if (opts.overrideJson) {
          try {
            const parsed = JSON.parse(opts.overrideJson) as CliConfig;
            await overrideConfig(parsed);
          } catch {
            console.error('Invalid JSON for --override-json');
            process.exitCode = 2;
            return;
          }
        }
        if (opts.list) {
          const cfg = await readConfig();
          const redacted = JSON.parse(JSON.stringify(cfg));
          if (redacted.apiKey) redacted.apiKey = maskKey(redacted.apiKey);
          if (redacted.profiles) {
            for (const p of Object.keys(redacted.profiles)) {
              if (redacted.profiles[p]?.apiKey)
                redacted.profiles[p]!.apiKey = maskKey(redacted.profiles[p]!.apiKey as string);
            }
          }
          console.log(JSON.stringify(redacted, null, 2));
          return;
        }

        const changes: Partial<CliConfig> = {};
        // Only support updating API key here; domain/model are managed via `init`
        if (opts.apiKey) changes.apiKey = opts.apiKey; // never log this

        if (Object.keys(changes).length > 0) {
          if (opts.profile) {
            await updateProfile(opts.profile, changes);
          } else {
            await updateConfig(changes);
          }
        }

        const cfg = await readConfig();
        const redacted = { ...cfg, apiKey: cfg.apiKey ? maskKey(cfg.apiKey) : undefined };
        console.log(JSON.stringify(redacted, null, 2));

        // If running in a TTY, drop into REPL with effective defaults
        if (process.stdout.isTTY) {
          try {
            const eff = await resolveConfig(opts.profile);
            const { ensureApiKey } = await import('./shared/auth.js');
            const r = await ensureApiKey(opts.profile, true);
            if (!('ok' in r) || !r.ok) {
              console.error(r.message);
              process.exitCode = 2;
              return;
            }
            const apiKey = r.apiKey;
            await startRepl({
              apiKey,
              domain: eff.domain ?? getDefaultConfig().domain,
              initialModel: eff.model ?? getDefaultConfig().model,
            });
          } catch (error) {
            console.error('Failed to start REPL:', error);
            process.exitCode = 1;
          }
        }
      }
    );

  program
    .command('test')
    .description('Check API connectivity via /models')
    .option('--profile <name>', 'Use a named profile')
    .option('--no-init', 'Do not run interactive init when missing API key')
    .action(async (opts: { profile?: string; init?: boolean }) => {
      const cfg = await resolveConfig(opts.profile);
      const { ensureApiKey } = await import('./shared/auth.js');
      const r = await ensureApiKey(opts.profile, opts.init);
      if (!('ok' in r) || !r.ok) {
        console.error(r.message);
        process.exitCode = 2;
        return;
      }
      const apiKey = r.apiKey;
      const domain = cfg.domain ?? getDefaultConfig().domain;
      const res = await testConnection({ domain, apiKey });
      console.log(JSON.stringify(res, null, 2));
    });

  program
    .command('ask')
    .description("One-shot question. Use 'openrouter init' to change defaults.")
    .argument('<prompt>', 'User prompt')
    .option('-s, --system <text>', 'System prompt')
    .option('--format <mode>', 'Output format: auto|plain|md (default: auto)')
    .option('--profile <name>', 'Use a named profile')
    .option('--no-stream', 'Disable streaming output')
    .option('--no-init', 'Do not run interactive init when missing API key')
    .action(async function (
      this: import('commander').Command,
      prompt: string,
      options: {
        system?: string;
        stream?: boolean;
        profile?: string;
        format?: OutputFormat;
        init?: boolean;
      }
    ) {
      const eff = await resolveConfig(options.profile);
      const { ensureApiKey } = await import('./shared/auth.js');
      const r = await ensureApiKey(options.profile, options.init);
      if (!('ok' in r) || !r.ok) {
        console.error(r.message);
        process.exitCode = 2;
        return;
      }
      const apiKey = r.apiKey;
      const model = eff.model || getDefaultConfig().model;
      const domain = eff.domain || getDefaultConfig().domain;
      const format: OutputFormat = (options.format as OutputFormat) || 'md';
      // Default streaming OFF unless user explicitly passed --no-stream/--stream (we honor only explicit input for stream)
      const src = (this as any).getOptionValueSource?.('stream');
      const streamExplicit = src === 'cli' || src === 'env';
      const chatOptions: ChatOptions = {
        domain,
        apiKey,
        model,
        system: options.system,
        stream: streamExplicit ? options.stream !== false : false,
      };
      if (chatOptions.stream) {
        const spinner = showSpinner('Thinking');
        let stopped = false;
        try {
          spinner.start();
          await streamChat(
            {
              ...chatOptions,
              onFirstToken: () => {
                if (!stopped) {
                  spinner.stop();
                  stopped = true;
                }
              },
              onDone: () => {
                if (!stopped) {
                  spinner.stop();
                  stopped = true;
                }
              },
            },
            [{ role: 'user', content: prompt }]
          );
          process.stdout.write('\n');
        } catch (err) {
          if (isPolicyError(err)) {
            await handlePolicyError({ where: 'ask-stream', tty: !!process.stdout.isTTY });
            return;
          }
          throw err;
        } finally {
          if (!stopped) {
            spinner.stop();
          }
        }
      } else {
        const spinner = showSpinner('Thinking…');
        try {
          spinner.start();
          const result = await askOnce(chatOptions, [{ role: 'user', content: prompt }]);
          const pretty = renderText(result.text, { format, streaming: false });
          // Styled header and footer around non-stream result
          process.stdout.write(answerHeader(model) + '\n');
          process.stdout.write(pretty + '\n');

          // Display usage information if available
          if (result.usage) {
            const usage = result.usage;
            const tokens = usage.total_tokens || usage.completion_tokens + usage.prompt_tokens;
            const cost = usage.total_cost || usage.cost;
            let usageInfo = `\nTokens: ${tokens}`;
            if (usage.prompt_tokens && usage.completion_tokens) {
              usageInfo += ` (prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens})`;
            }
            if (cost) {
              usageInfo += ` | Cost: $${cost.toFixed(6)}`;
            }
            process.stdout.write(usageInfo + '\n');
          }

          process.stdout.write(infoFooter({ model, domain }) + '\n');
        } catch (err) {
          if (isPolicyError(err)) {
            await handlePolicyError({ where: 'ask', tty: !!process.stdout.isTTY });
            return;
          }
          throw err;
        } finally {
          spinner.stop();
        }
      }
    });

  program
    .command('repl')
    .description(
      'Interactive chat with streaming. Commands: exit, /model, /system, /format, /stream'
    )
    .option('-m, --model <name>', 'Override model for this session')
    .option('--profile <name>', 'Use a named profile')
    .option('--no-init', 'Do not run interactive init when missing API key')
    .action(async (options: { model?: string; profile?: string; init?: boolean }) => {
      const eff = await resolveConfig(options.profile);
      const { ensureApiKey } = await import('./shared/auth.js');
      const r = await ensureApiKey(options.profile, options.init);
      if (!('ok' in r) || !r.ok) {
        console.error(r.message);
        process.exitCode = 2;
        return;
      }
      const apiKey = r.apiKey;
      await startRepl({
        apiKey,
        domain: eff.domain ?? getDefaultConfig().domain,
        initialModel: options.model ?? eff.model ?? getDefaultConfig().model,
      });
    });

  program
    .command('init')
    .description('Interactive first-time setup (provider, domain, key, model, profile)')
    .action(async () => {
      await runInitWizard();
      // After init, drop into REPL with effective defaults when in a TTY
      if (process.stdout.isTTY) {
        try {
          const eff = await resolveConfig();
          const { ensureApiKey } = await import('./shared/auth.js');
          const r = await ensureApiKey(undefined, false); // avoid re-entering init from here
          if (!('ok' in r) || !r.ok) {
            console.error(r.message);
            process.exitCode = 2;
            return;
          }
          const apiKey = r.apiKey;
          await startRepl({
            apiKey,
            domain: eff.domain ?? getDefaultConfig().domain,
            initialModel: eff.model ?? getDefaultConfig().model,
          });
        } catch (error) {
          console.error('Failed to start REPL after init:', error);
          process.exitCode = 1;
        }
      }
    });

  // Additional commands
  registerModelsCommand(program);

  return program;
}

export async function main() {
  const program = buildProgram();
  if (process.argv.length <= 2) {
    // No args: launch init flow by default
    await program.parseAsync(['node', 'openrouter', 'init']);
    return;
  }
  await program.parseAsync(process.argv);
}
