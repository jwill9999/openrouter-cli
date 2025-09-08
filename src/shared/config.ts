import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export type CliConfig = {
  domain?: string;
  model?: string;
  apiKey?: string; // optional persisted key
  profiles?: Record<string, Omit<CliConfig, 'profiles'>>;
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

// Update or create a named profile within the global config
export async function updateProfile(profile: string, patch: Partial<CliConfig>) {
  const current = await readConfig();
  const profiles = { ...(current.profiles || {}) } as NonNullable<CliConfig['profiles']>;
  const cur = profiles[profile] || {};
  // Remove 'profiles' property from patch to prevent nested profiles
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { profiles: _omit, ...safePatch } = patch;
  profiles[profile] = { ...cur, ...safePatch };
  await updateConfig({ profiles });
}

// Project-local overrides: .openrouterrc(.json|.yaml|.yml)
export async function readProjectRc(cwd = process.cwd()): Promise<Partial<CliConfig>> {
  const candidates = [
    path.join(cwd, ".openrouterrc"),
    path.join(cwd, ".openrouterrc.json"),
    path.join(cwd, ".openrouterrc.yaml"),
    path.join(cwd, ".openrouterrc.yml"),
  ];
  for (const file of candidates) {
    try {
      const txt = await fs.readFile(file, "utf8");
      const parsed = await parseRc(txt, path.extname(file));
      return (parsed || {}) as Partial<CliConfig>;
    } catch (err: any) {
      if (err?.code === "ENOENT") continue;
      throw err;
    }
  }
  return {};
}

async function parseRc(text: string, ext: string) {
  try {
    if (ext === ".yaml" || ext === ".yml") {
      const { safeLoad } = await import("js-yaml");
      return safeLoad(text) as unknown;
    }
    // Try JSON first for no-extension or .json
    return JSON.parse(text);
  } catch (e) {
    // Fallback: if no extension, try YAML
    if (!ext) {
      try {
        const { safeLoad } = await import("js-yaml");
        return safeLoad(text) as unknown;
      } catch {}
    }
    throw e;
  }
}

export type ResolvedConfig = {
  domain?: string;
  model?: string;
  apiKey?: string;
};

// Resolve effective config with precedence: project > profile > global base
export async function resolveConfig(profile?: string): Promise<ResolvedConfig> {
  const global = await readConfig();
  const project = await readProjectRc();
  const base = { domain: global.domain, model: global.model, apiKey: global.apiKey };
  const prof = profile ? global.profiles?.[profile] || {} : {};
  return { ...base, ...prof, ...project };
}
