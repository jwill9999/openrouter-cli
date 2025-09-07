import { Command } from "commander";
import { readConfig, updateConfig, ensureConfigDir, updateProfile, resolveConfig } from "./shared/config.js";
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
    .option("--profile <name>", "Select profile to read/update (default: base)")
    .option("--list", "List profiles and current base config")
    .action(async (opts: { domain?: string; model?: string; apiKey?: string; profile?: string; list?: boolean }) => {
      await ensureConfigDir();
      if (opts.list) {
        const cfg = await readConfig();
        const redacted = JSON.parse(JSON.stringify(cfg));
        if (redacted.apiKey) redacted.apiKey = maskKey(redacted.apiKey);
        if (redacted.profiles) {
          for (const p of Object.keys(redacted.profiles)) {
            if (redacted.profiles[p]?.apiKey) redacted.profiles[p]!.apiKey = maskKey(redacted.profiles[p]!.apiKey as string);
          }
        }
        console.log(JSON.stringify(redacted, null, 2));
        return;
      }

      const changes: Record<string, unknown> = {};

      if (opts.domain) changes.domain = opts.domain;
      if (opts.model) changes.model = opts.model;
      if (opts.apiKey) changes.apiKey = opts.apiKey; // never log this

      if (Object.keys(changes).length > 0) {
        if (opts.profile) {
          await updateProfile(opts.profile, changes as any);
        } else {
          await updateConfig(changes);
        }
      }

      const cfg = await readConfig();
      const redacted = { ...cfg, apiKey: cfg.apiKey ? maskKey(cfg.apiKey) : undefined };
      console.log(JSON.stringify(redacted, null, 2));
    });

  program
    .command("test")
    .description("Check API connectivity via /models")
    .option("--profile <name>", "Use a named profile")
    .action(async (opts: { profile?: string }) => {
      const cfg = await resolveConfig(opts.profile);
      const apiKey = getApiKey(await readConfig()) || cfg.apiKey;
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
    .option("--profile <name>", "Use a named profile")
    .option("--no-stream", "Disable streaming output")
    .action(async (prompt: string, options: { model?: string; system?: string; stream?: boolean; profile?: string }) => {
      const eff = await resolveConfig(options.profile);
      const apiKey = getApiKey(await readConfig()) || eff.apiKey;
      if (!apiKey) {
        console.error("Missing API key. Set OPENROUTER_API_KEY / OPENAI_API_KEY or 'openrouter config --api-key'.");
        process.exitCode = 2;
        return;
      }
      const model = options.model || eff.model || getDefaultConfig().model;
      const domain = eff.domain || getDefaultConfig().domain;
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
    .option("--profile <name>", "Use a named profile")
    .action(async (options: { model?: string; profile?: string }) => {
      const eff = await resolveConfig(options.profile);
      const apiKey = getApiKey(await readConfig()) || eff.apiKey;
      if (!apiKey) {
        console.error("Missing API key. Set OPENROUTER_API_KEY / OPENAI_API_KEY or 'openrouter config --api-key'.");
        process.exitCode = 2;
        return;
      }
      await startRepl({
        apiKey,
        domain: eff.domain ?? getDefaultConfig().domain,
        initialModel: options.model ?? eff.model ?? getDefaultConfig().model,
      });
    });

  await program.parseAsync(process.argv);
}
