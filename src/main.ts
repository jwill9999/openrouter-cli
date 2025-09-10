import { Command } from "commander";
import { readConfig, updateConfig, ensureConfigDir, updateProfile, resolveConfig } from "./shared/config.js";
import { getApiKey, getDefaultConfig, maskKey } from "./shared/env.js";
import { testConnection, askOnce, ChatOptions, streamChat } from "./shared/openrouter.js";
import { renderText, OutputFormat } from "./shared/format.js";
import { startRepl } from "./repl.js";
import { runInitWizard } from "./shared/init.js";

export function buildProgram() {
  const program = new Command();
  program
    .name("openrouter")
    .description("OpenRouter CLI")
    .version("0.1.0");

  program
    .command("config")
    .description("Show configuration or update API key")
    .option("--api-key <key>", "Persist API key (use env for ephemeral)")
    .option("--profile <name>", "Select profile to read/update (default: base)")
    .option("--list", "List profiles and current base config")
    .action(async (opts: { apiKey?: string; profile?: string; list?: boolean }) => {
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
      // Only support updating API key here; domain/model are managed via `init`
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
    .option("--no-init", "Do not run interactive init when missing API key")
    .action(async (opts: { profile?: string; init?: boolean }) => {
      const cfg = await resolveConfig(opts.profile);
      let apiKey = getApiKey(await readConfig()) || cfg.apiKey;
      if (!apiKey && process.stdout.isTTY && opts.init !== false) {
        const ok = await runInitWizard();
        if (ok) {
          const refreshed = await resolveConfig(opts.profile);
          apiKey = getApiKey(await readConfig()) || refreshed.apiKey;
        }
      }
      if (!apiKey) { console.error("Missing API key. Set OPENROUTER_API_KEY / OPENAI_API_KEY or run 'openrouter init'."); process.exitCode = 2; return; }
      const domain = cfg.domain ?? getDefaultConfig().domain;
      const res = await testConnection({ domain, apiKey });
      console.log(JSON.stringify(res, null, 2));
    });

  program
    .command("ask")
    .description("One-shot question. Use 'openrouter init' to change defaults.")
    .argument("<prompt>", "User prompt")
    .option("-s, --system <text>", "System prompt")
    .option("--format <mode>", "Output format: auto|plain|md (default: auto)")
    .option("--profile <name>", "Use a named profile")
    .option("--no-stream", "Disable streaming output")
    .option("--no-init", "Do not run interactive init when missing API key")
    .action(async (prompt: string, options: { system?: string; stream?: boolean; profile?: string; format?: OutputFormat; init?: boolean }) => {
      const eff = await resolveConfig(options.profile);
      let apiKey = getApiKey(await readConfig()) || eff.apiKey;
      if (!apiKey && process.stdout.isTTY && options.init !== false) {
        const ok = await runInitWizard();
        if (ok) {
          const refreshed = await resolveConfig(options.profile);
          apiKey = getApiKey(await readConfig()) || refreshed.apiKey;
        }
      }
      if (!apiKey) { console.error("Missing API key. Set OPENROUTER_API_KEY / OPENAI_API_KEY or run 'openrouter init'."); process.exitCode = 2; return; }
      const model = eff.model || getDefaultConfig().model;
      const domain = eff.domain || getDefaultConfig().domain;
      const format: OutputFormat = (options.format as OutputFormat) || "auto";
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
        const pretty = renderText(out, { format, streaming: false });
        console.log(pretty);
      }
    });

  program
    .command("repl")
    .description("Interactive chat with streaming. Commands: exit, /model, /system, /format, /stream")
    .option("-m, --model <name>", "Override model for this session")
    .option("--profile <name>", "Use a named profile")
    .option("--no-init", "Do not run interactive init when missing API key")
    .action(async (options: { model?: string; profile?: string; init?: boolean }) => {
      const eff = await resolveConfig(options.profile);
      let apiKey = getApiKey(await readConfig()) || eff.apiKey;
      if (!apiKey && process.stdout.isTTY && options.init !== false) {
        const ok = await runInitWizard();
        if (ok) {
          const refreshed = await resolveConfig(options.profile);
          apiKey = getApiKey(await readConfig()) || refreshed.apiKey;
        }
      }
      if (!apiKey) { console.error("Missing API key. Set OPENROUTER_API_KEY / OPENAI_API_KEY or run 'openrouter init'."); process.exitCode = 2; return; }
      await startRepl({
        apiKey,
        domain: eff.domain ?? getDefaultConfig().domain,
        initialModel: options.model ?? eff.model ?? getDefaultConfig().model,
      });
    });

  program
    .command("init")
    .description("Interactive first-time setup (provider, domain, key, model, profile)")
    .action(async () => {
      await runInitWizard();
    });

  return program;
}

export async function main() {
  const program = buildProgram();
  await program.parseAsync(process.argv);
}
