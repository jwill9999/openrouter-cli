import { Command } from "commander";
import { readConfig, updateConfig, ensureConfigDir } from "./shared/config.js";
import { getApiKey, getDefaultConfig, maskKey } from "./shared/env.js";
import { testConnection, askOnce, ChatOptions, streamChat } from "./shared/openrouter.js";
import { startRepl } from "./repl.js";

export async function main() {
  const program = new Command();
  program
    .name("openrouter")
    .description("OpenRouter CLI")
    .version("0.1.0");

  program
    .command("config")
    .description("Show or update configuration")
    .option("--domain <url>", "Set API domain (OpenAI-compatible)")
    .option("--model <name>", "Set default model")
    .option("--api-key <key>", "Persist API key (use env for ephemeral)")
    .action(async (opts: { domain?: string; model?: string; apiKey?: string }) => {
      await ensureConfigDir();
      const changes: Record<string, unknown> = {};

      if (opts.domain) changes.domain = opts.domain;
      if (opts.model) changes.model = opts.model;
      if (opts.apiKey) changes.apiKey = opts.apiKey; // never log this

      if (Object.keys(changes).length > 0) {
        await updateConfig(changes);
      }

      const cfg = await readConfig();
      const redacted = { ...cfg, apiKey: cfg.apiKey ? maskKey(cfg.apiKey) : undefined };
      console.log(JSON.stringify(redacted, null, 2));
    });

  program
    .command("test")
    .description("Check API connectivity via /models")
    .action(async () => {
      const cfg = await readConfig();
      const apiKey = getApiKey(cfg);
      if (!apiKey) {
        console.error("Missing API key. Set OPENROUTER_API_KEY / OPENAI_API_KEY or 'openrouter config --api-key'.");
        process.exitCode = 2;
        return;
      }
      const domain = cfg.domain ?? getDefaultConfig().domain;
      const res = await testConnection({ domain, apiKey });
      console.log(JSON.stringify(res, null, 2));
    });

  program
    .command("ask")
    .description("One-shot question to the chat model")
    .argument("<prompt>", "User prompt")
    .option("-m, --model <name>", "Override model")
    .option("-s, --system <text>", "System prompt")
    .option("--no-stream", "Disable streaming output")
    .action(async (prompt: string, options: { model?: string; system?: string; stream?: boolean }) => {
      const cfg = await readConfig();
      const apiKey = getApiKey(cfg);
      if (!apiKey) {
        console.error("Missing API key. Set OPENROUTER_API_KEY / OPENAI_API_KEY or 'openrouter config --api-key'.");
        process.exitCode = 2;
        return;
      }
      const model = options.model || cfg.model || getDefaultConfig().model;
      const domain = cfg.domain || getDefaultConfig().domain;
      const chatOptions: ChatOptions = {
        domain,
        apiKey,
        model,
        system: options.system,
        stream: options.stream !== false,
      };
      if (chatOptions.stream) {
        await streamChat(chatOptions, [{ role: "user", content: prompt }]);
        process.stdout.write("\n");
      } else {
        const out = await askOnce(chatOptions, [{ role: "user", content: prompt }]);
        console.log(out);
      }
    });

  program
    .command("repl")
    .description("Interactive chat with streaming. Commands: exit, /model, /system")
    .option("-m, --model <name>", "Override model for this session")
    .action(async (options: { model?: string }) => {
      const cfg = await readConfig();
      const apiKey = getApiKey(cfg);
      if (!apiKey) {
        console.error("Missing API key. Set OPENROUTER_API_KEY / OPENAI_API_KEY or 'openrouter config --api-key'.");
        process.exitCode = 2;
        return;
      }
      await startRepl({
        apiKey,
        domain: cfg.domain ?? getDefaultConfig().domain,
        initialModel: options.model ?? cfg.model ?? getDefaultConfig().model,
      });
    });

  await program.parseAsync(process.argv);
}
