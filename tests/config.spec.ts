import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Import config helpers dynamically after HOME/CWD are set
let cfgModule: typeof import('../src/shared/config.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let origHome: string;
let origCwd: string;

async function mkdtemp(base: string) {
  const dir = await fs.mkdtemp(path.join(base, 'orcli-'));
  return dir;
}

beforeEach(async () => {
  origHome = os.homedir();
  origCwd = process.cwd();
  const tmpHome = await mkdtemp(os.tmpdir());
  process.env.HOME = tmpHome;
  // adjust CONFIG_DIR to the new HOME in this process by reassigning env;
  // functions compute it on import; tests rely on fresh process environment per run in CI.
  const tmpProject = await mkdtemp(os.tmpdir());
  process.chdir(tmpProject);
  cfgModule = await import('../src/shared/config.js');
});

afterEach(async () => {
  process.env.HOME = origHome;
  process.chdir(origCwd);
});

describe('config precedence and profiles', () => {
  it('merges global base + profile + project rc (project wins)', async () => {
    // Write global base config
    await fs.mkdir(cfgModule.paths.CONFIG_DIR, { recursive: true });
    await cfgModule.updateConfig({ domain: 'https://global.example/v1', model: 'global-model', apiKey: 'sk-global' });
    await cfgModule.updateProfile('dev', { domain: 'https://dev.example/v1', model: 'dev-model' });

    // Write project rc overriding model only
    const rcPath = path.join(process.cwd(), '.openrouterrc');
    await fs.writeFile(rcPath, JSON.stringify({ model: 'project-model' }, null, 2));

    const eff = await cfgModule.resolveConfig('dev');
    expect(eff.domain).toBe('https://dev.example/v1');
    expect(eff.model).toBe('project-model');
    // apiKey comes from global if not in profile/project
    expect(eff.apiKey).toBe('sk-global');
  });
});
