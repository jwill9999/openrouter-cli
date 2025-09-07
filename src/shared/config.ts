import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export type CliConfig = {
  domain?: string;
  model?: string;
  apiKey?: string; // optional persisted key
};

const CONFIG_DIR = path.join(os.homedir(), ".config", "openrouter-cli");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export async function ensureConfigDir() {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  // best-effort chmod 600 on directory and file later
  try {
    await fs.chmod(CONFIG_DIR, 0o700);
  } catch {}
}

export async function readConfig(): Promise<CliConfig> {
  try {
    const txt = await fs.readFile(CONFIG_FILE, "utf8");
    const json = JSON.parse(txt) as CliConfig;
    return json;
  } catch (err: any) {
    if (err?.code === "ENOENT") return {};
    throw err;
  }
}

export async function updateConfig(patch: Partial<CliConfig>) {
  const current = await readConfig();
  const next = { ...current, ...patch } satisfies CliConfig;
  await ensureConfigDir();
  const data = JSON.stringify(next, null, 2);
  await fs.writeFile(CONFIG_FILE, data, { mode: 0o600 });
  try {
    await fs.chmod(CONFIG_FILE, 0o600);
  } catch {}
}

export const paths = { CONFIG_DIR, CONFIG_FILE } as const;

