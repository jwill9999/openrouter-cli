import readline from "node:readline";
import { streamChat, askOnce } from "./shared/openrouter.js";
import { renderText, OutputFormat } from "./shared/format.js";

type ReplOptions = {
  apiKey: string;
  domain: string;
  initialModel: string;
};

export async function startRepl(opts: ReplOptions) {
  let currentModel = opts.initialModel;
  let system: string | undefined;
  let format: OutputFormat = "plain"; // default plain for streaming sessions
  let streaming = true;
  const history: { role: "user" | "assistant"; content: string }[] = [];

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const prompt = () => rl.setPrompt(`(${currentModel}) > `);
  prompt();
  rl.prompt();

  console.log("Type 'exit' to quit. Commands: /model <name>, /system <text>, /format <md|plain>, /stream <on|off>. Use 'openrouter init' to change defaults.");

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
        await streamChat({ domain: opts.domain, apiKey: opts.apiKey, model: currentModel, system, stream: true }, [
          ...history,
        ]);
        process.stdout.write("\n");
      } else {
        const text = await askOnce({ domain: opts.domain, apiKey: opts.apiKey, model: currentModel, system, stream: false }, [
          ...history,
        ]);
        const pretty = renderText(text, { format, streaming: false });
        process.stdout.write(pretty + "\n");
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
    }
    rl.prompt();
  });

  await new Promise<void>((resolve) => rl.on("close", () => resolve()));
}
