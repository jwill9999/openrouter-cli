import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

let cfg: typeof import('../src/shared/config.js');
let main: typeof import('../src/main.js');

let origHome: string;
let origCwd: string;

async function mkdtemp(base: string) {
  return fs.mkdtemp(path.join(base, 'orcli-'));
}

beforeEach(async () => {
  origHome = os.homedir();
  origCwd = process.cwd();
  const tmpHome = await mkdtemp(os.tmpdir());
  process.env.HOME = tmpHome;
  const tmpProject = await mkdtemp(os.tmpdir());
  process.chdir(tmpProject);
  cfg = await import('../src/shared/config.js');
  main = await import('../src/main.js');
});

afterEach(async () => {
  process.env.HOME = origHome;
  process.chdir(origCwd);
});

describe('config --list redaction', () => {
  it('masks base and profile api keys in output', async () => {
    await fs.mkdir(cfg.paths.CONFIG_DIR, { recursive: true });
    await cfg.updateConfig({ apiKey: 'sk-global-12345678', model: 'm', domain: 'https://d' });
    await cfg.updateProfile('dev', { apiKey: 'sk-dev-ABCDEFGH', model: 'x' });

    const program = main.buildProgram();
    let out = '';
    const origLog = console.log;
    console.log = (s?: any) => { out += (typeof s === 'string' ? s : String(s)); };
    try {
      await program.parseAsync(['node', 'cli', 'config', '--list']);
    } finally {
      console.log = origLog;
    }
    const json = JSON.parse(out);
    expect(json.apiKey).toContain('****');
    expect(json.apiKey.startsWith('sk-g')).toBeTruthy();
    expect(json.apiKey.endsWith('5678')).toBeTruthy();
    expect(json.profiles.dev.apiKey).toContain('****');
    expect(json.profiles.dev.apiKey.startsWith('sk-d')).toBeTruthy();
    expect(json.profiles.dev.apiKey.endsWith('EFGH')).toBeTruthy();
  });
});
