import readline from 'node:readline';
import { streamChat, askOnce, getCredits } from './shared/openrouter.js';
import { renderText, OutputFormat } from './shared/format.js';
import { showSpinner } from './shared/ui.js';
import { logError } from './shared/logger.js';
import { styledPrompt, tipBox } from './shared/ui.js';
// dynamic imports used when needed to avoid readline conflicts
import { fetchModelsCached, fuzzyIds } from './shared/models.js';

type ReplOptions = {
  apiKey: string;
  domain: string;
  initialModel: string;
};

export async function startRepl(opts: ReplOptions) {
  let currentModel = opts.initialModel;
  let system: string | undefined;
  let format: OutputFormat = 'md'; // default rendered markdown for non-stream outputs
  let streaming = false;
  const history: { role: 'user' | 'assistant'; content: string }[] = [];
  let shouldExit = false;

  // Session tracking
  let sessionTokens = 0;
  let sessionCost = 0;
  let sessionRequests = 0;

  async function promptUser(): Promise<void> {
    if (shouldExit) return;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      prompt: '',
      historySize: 100,
      escapeCodeTimeout: 50,
      removeHistoryDuplicates: true,
    });

    const prompt = () => rl.setPrompt(styledPrompt(currentModel));
    prompt();

    if (history.length === 0) {
      console.log(tipBox());
    }

    rl.on('line', async (line) => {
      const input = line.trim();

      if (!input) {
        rl.prompt();
        return;
      }
      if (input === 'exit') {
        shouldExit = true;
        rl.close();
        return;
      }

      // Close the readline interface after getting input
      rl.close();
      if (input === '/model') {
        try {
          const spinner = showSpinner('Loading models…');
          spinner.start();
          const list = await fetchModelsCached({ domain: opts.domain, apiKey: opts.apiKey });
          spinner.stop();

          // Create a new readline interface for model selection
          const modelRl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
          });

          const askModel = (q: string) =>
            new Promise<string>((res) => modelRl.question(q, (ans) => res(ans.trim())));

          const query = await askModel('Search models (>=2 chars, blank to cancel): ');
          if (!query) {
            modelRl.close();
            await promptUser();
            return;
          }

          const ids = fuzzyIds(query, list, 10);
          if (!ids.length) {
            console.log('No matches.');
            modelRl.close();
            await promptUser();
            return;
          }

          console.log('Matches:');
          ids.forEach((id, i) => {
            const meta = list.find((m) => m.id === id);
            const name = meta?.name ? ` — ${meta.name}` : '';
            console.log(`${i + 1}. ${id}${name}`);
          });

          const sel = await askModel(`Pick 1-${ids.length} or type a model id: `);
          let chosen = '';
          const n = Number(sel);
          if (sel && Number.isInteger(n) && n >= 1 && n <= ids.length) {
            chosen = ids[n - 1];
          } else if (sel) {
            chosen = sel;
          }

          if (chosen) {
            currentModel = chosen;
            console.log(`[model: ${currentModel}]`);
          }

          modelRl.close();
        } catch (e) {
          await logError(e, 'repl-model-picker');
          console.log("Tip: run 'openrouter models' in another terminal to browse models.");
        }

        // Ensure clean terminal state before restarting
        process.stdout.write('\n');
        await promptUser();
        return;
      }
      if (input.startsWith('/model ')) {
        currentModel = input.slice('/model '.length).trim();
        console.log(`[model: ${currentModel}]`);
        await promptUser();
        return;
      }
      if (input.startsWith('/system ')) {
        system = input.slice('/system '.length).trim();
        console.log('[system set]');
        await promptUser();
        return;
      }
      if (input.startsWith('/format ')) {
        const val = input.slice('/format '.length).trim();
        if (val === 'md' || val === 'plain') {
          format = val;
          console.log(`[format: ${format}]`);
        } else {
          console.log('Usage: /format md|plain');
        }
        await promptUser();
        return;
      }
      if (input.startsWith('/stream ')) {
        const val = input.slice('/stream '.length).trim();
        if (val === 'on') streaming = true;
        else if (val === 'off') streaming = false;
        else console.log('Usage: /stream on|off');
        console.log(`[stream: ${streaming ? 'on' : 'off'}]`);
        await promptUser();
        return;
      }
      if (input === '/stats') {
        console.log(`\nSession Statistics:`);
        console.log(`Model: ${currentModel}`);
        console.log(`Total tokens: ${sessionTokens}`);
        console.log(`Total requests: ${sessionRequests}`);
        if (sessionCost > 0) {
          console.log(`Total cost: $${sessionCost.toFixed(6)}`);
        } else {
          console.log(`Total cost: Free`);
        }
        console.log(
          `Average tokens per request: ${sessionRequests > 0 ? Math.round(sessionTokens / sessionRequests) : 0}`
        );
        await promptUser();
        return;
      }
      if (input === '/billing') {
        try {
          const spinner = showSpinner('Fetching billing info…');
          spinner.start();
          const credits = await getCredits({ domain: opts.domain, apiKey: opts.apiKey });
          spinner.stop();

          console.log(`\nOpenRouter Account Credits:`);
          if (credits.data) {
            const data = credits.data;
            console.log(`Total credits purchased: $${(data.total_credits || 0).toFixed(6)}`);
            console.log(`Total usage: $${(data.total_usage || 0).toFixed(6)}`);
            console.log(
              `Current balance: $${((data.total_credits || 0) - (data.total_usage || 0)).toFixed(6)}`
            );
            if (data.credit_limit) {
              console.log(`Credit limit: $${data.credit_limit.toFixed(6)}`);
            }
          } else {
            console.log(`Credits info: ${JSON.stringify(credits, null, 2)}`);
          }
        } catch (err) {
          console.error('Failed to fetch billing info:', err);
        }
        await promptUser();
        return;
      }

      const userMsg = { role: 'user' as const, content: input };
      history.push(userMsg);

      // Process the message and then prompt
      try {
        if (streaming) {
          const spinner = showSpinner('Thinking');
          let stopped = false;
          try {
            spinner.start();
            await streamChat(
              {
                domain: opts.domain,
                apiKey: opts.apiKey,
                model: currentModel,
                system,
                stream: true,
                onFirstToken: () => {
                  if (!stopped) {
                    // Change spinner text to "Answer" before clearing
                    spinner.text = 'Answer';
                    // Give a brief moment to show the "Answer" text
                    setTimeout(() => {
                      spinner.clear();
                      spinner.stop();
                      // Add blank line for separation
                      process.stdout.write('\n');
                      stopped = true;
                    }, 200);
                  }
                },
                onDone: () => {
                  if (!stopped) {
                    spinner.stop();
                    stopped = true;
                  }
                },
              },
              [...history]
            );
            process.stdout.write('\n');

            // Add the assistant's response to history
            // Note: We can't easily capture the full response text from streaming
            // so we'll add a placeholder that gets updated after the response
            const assistantMsg = { role: 'assistant' as const, content: '[STREAMING_RESPONSE]' };
            history.push(assistantMsg);
          } finally {
            if (!stopped) {
              spinner.stop();
            }
          }
        } else {
          const spinner = showSpinner('Thinking…');
          try {
            spinner.start();
            const result = await askOnce(
              {
                domain: opts.domain,
                apiKey: opts.apiKey,
                model: currentModel,
                system,
                stream: false,
              },
              [...history]
            );
            const pretty = renderText(result.text, { format, streaming: false });
            process.stdout.write(pretty + '\n');

            // Add the assistant's response to history
            const assistantMsg = { role: 'assistant' as const, content: result.text };
            history.push(assistantMsg);

            // Display usage information if available
            if (result.usage) {
              const usage = result.usage;
              const tokens = usage.total_tokens || usage.completion_tokens + usage.prompt_tokens;
              const cost = usage.total_cost || usage.cost || 0;

              // Update session totals
              sessionTokens += tokens;
              sessionCost += cost;
              sessionRequests += 1;

              let usageInfo = `\nTokens: ${tokens}`;
              if (usage.prompt_tokens && usage.completion_tokens) {
                usageInfo += ` (prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens})`;
              }

              if (cost > 0) {
                usageInfo += ` | Cost: $${cost.toFixed(6)}`;
              } else {
                usageInfo += ` | Free`;
              }

              // Show session totals
              usageInfo += `\nSession: ${sessionTokens} tokens`;
              if (sessionCost > 0) {
                usageInfo += `, $${sessionCost.toFixed(6)} total`;
              } else {
                usageInfo += `, free`;
              }
              usageInfo += ` (${sessionRequests} requests)`;

              process.stdout.write(usageInfo + '\n');
            }
          } finally {
            spinner.stop();
          }
        }
      } catch (err) {
        if ((await import('./shared/errors.js')).isPolicyError(err)) {
          const { handlePolicyError } = await import('./shared/errors.js');
          await handlePolicyError({
            where: 'repl',
            tty: !!process.stdout.isTTY,
            interactivePrompt: false,
          });
        } else {
          await logError(err, 'repl');
          console.error('A technical issue occurred. Please try again.');
        }
      }

      // Continue with next prompt
      await promptUser();
    });

    // Start the initial prompt
    rl.prompt();
    await new Promise<void>((resolve) => rl.once('close', resolve));
  }

  await promptUser();
}
