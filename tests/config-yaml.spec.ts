import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

let cfgModule: typeof import('../src/shared/config.js');

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
  const tmpProject = await mkdtemp(os.tmpdir());
  process.chdir(tmpProject);
  cfgModule = await import('../src/shared/config.js');
});

afterEach(async () => {
  process.env.HOME = origHome;
  process.chdir(origCwd);
});

describe('project YAML rc precedence', () => {
  it('reads .openrouterrc.yaml and overrides model', async () => {
    await fs.mkdir(cfgModule.paths.CONFIG_DIR, { recursive: true });
    await cfgModule.updateConfig({ domain: 'https://global.example/v1', model: 'global-model', apiKey: 'sk-global' });
    await cfgModule.updateProfile('dev', { domain: 'https://dev.example/v1', model: 'dev-model' });

    const rcPath = path.join(process.cwd(), '.openrouterrc.yaml');
    await fs.writeFile(rcPath, 'model: project-model\n');

    const eff = await cfgModule.resolveConfig('dev');
    expect(eff.domain).toBe('https://dev.example/v1');
    expect(eff.model).toBe('project-model');
    expect(eff.apiKey).toBe('sk-global');
  });
});

