import readline from "node:readline";
import { streamChat } from "./shared/openrouter.js";

type ReplOptions = {
  apiKey: string;
  domain: string;
  initialModel: string;
};

export async function startRepl(opts: ReplOptions) {
  let currentModel = opts.initialModel;
  let system: string | undefined;
  const history: { role: "user" | "assistant"; content: string }[] = [];

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const prompt = () => rl.setPrompt(`(${currentModel}) > `);
  prompt();
  rl.prompt();

  console.log("Type 'exit' to quit. Commands: /model <name>, /system <text>");

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

    const userMsg = { role: "user" as const, content: input };
    history.push(userMsg);
    try {
      await streamChat({ domain: opts.domain, apiKey: opts.apiKey, model: currentModel, system, stream: true }, [
        ...history,
      ]);
      process.stdout.write("\n");
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
    }
    rl.prompt();
  });

  await new Promise<void>((resolve) => rl.on("close", () => resolve()));
}

