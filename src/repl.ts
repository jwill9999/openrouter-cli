import readline from "node:readline";
import { streamChat, askOnce } from "./shared/openrouter.js";
import { renderText, OutputFormat } from "./shared/format.js";
import { showSpinner } from "./shared/ui.js";
import { logError } from "./shared/logger.js";
import { styledPrompt, tipBox } from "./shared/ui.js";

type ReplOptions = {
  apiKey: string;
  domain: string;
  initialModel: string;
};

export async function startRepl(opts: ReplOptions) {
  let currentModel = opts.initialModel;
  let system: string | undefined;
  let format: OutputFormat = "md"; // default rendered markdown for non-stream outputs
  let streaming = false;
  const history: { role: "user" | "assistant"; content: string }[] = [];

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true, prompt: '', historySize: 100, escapeCodeTimeout: 50 });
  const prompt = () => rl.setPrompt(styledPrompt(currentModel));
  prompt();
  rl.prompt();

  console.log(tipBox());

  // Keep REPL alive on Ctrl+C (SIGINT); show prompt again
  rl.on('SIGINT', () => {
    process.stdout.write("\n");
    rl.prompt();
  });

  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }
    if (input === "exit") {
      rl.close();
      return;
    }
    if (input.startsWith("/model ")) {
      currentModel = input.slice("/model ".length).trim();
      prompt();
      rl.prompt();
      return;
    }
    if (input.startsWith("/system ")) {
      system = input.slice("/system ".length).trim();
      console.log("[system set]");
      rl.prompt();
      return;
    }
    if (input.startsWith("/format ")) {
      const val = input.slice("/format ".length).trim();
      if (val === "md" || val === "plain") {
        format = val;
        console.log(`[format: ${format}]`);
      } else {
        console.log("Usage: /format md|plain");
      }
      rl.prompt();
      return;
    }
    if (input.startsWith("/stream ")) {
      const val = input.slice("/stream ".length).trim();
      if (val === "on") streaming = true;
      else if (val === "off") streaming = false;
      else console.log("Usage: /stream on|off");
      console.log(`[stream: ${streaming ? "on" : "off"}]`);
      rl.prompt();
      return;
    }

    const userMsg = { role: "user" as const, content: input };
    history.push(userMsg);
    try {
      if (streaming) {
        const spinner = showSpinner('Thinking');
        let stopped = false;
        try {
          spinner.start();
          await streamChat({
            domain: opts.domain,
            apiKey: opts.apiKey,
            model: currentModel,
            system,
            stream: true,
            onFirstToken: () => { if (!stopped) { spinner.stop(); stopped = true; } },
            onDone: () => { if (!stopped) { spinner.stop(); stopped = true; } },
          }, [
            ...history,
          ]);
          process.stdout.write("\n");
        } finally {
          if (!stopped) { spinner.stop(); }
        }
      } else {
        const spinner = showSpinner('Thinking…');
        try {
          spinner.start();
          const text = await askOnce({ domain: opts.domain, apiKey: opts.apiKey, model: currentModel, system, stream: false }, [
            ...history,
          ]);
          const pretty = renderText(text, { format, streaming: false });
          process.stdout.write(pretty + "\n");
        } finally {
          spinner.stop();
        }
      }
    } catch (err) {
      await logError(err, 'repl');
      console.error('A technical issue occurred. Please try again.');
    }
    rl.prompt();
  });

  await new Promise<void>((resolve) => rl.on("close", () => resolve()));
}
