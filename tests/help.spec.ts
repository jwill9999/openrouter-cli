import { describe, it, expect } from 'vitest';
import { buildProgram } from '../src/main.js';

describe('CLI help output', () => {
  it('lists core commands and omits ask model override', () => {
    const program = buildProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toEqual(expect.arrayContaining(['init', 'config', 'ask', 'repl', 'test']));

    const ask = program.commands.find((c) => c.name() === 'ask')!;
    const askHelp = ask.helpInformation();
    expect(askHelp).not.toContain('--model');
    expect(askHelp).toContain('--format');
    expect(askHelp).toContain("Use 'openrouter init' to change defaults");

    const cfg = program.commands.find((c) => c.name() === 'config')!;
    const cfgHelp = cfg.helpInformation();
    expect(cfgHelp).toContain('--api-key');
    expect(cfgHelp).not.toMatch(/--domain|--model|--provider/);

    const repl = program.commands.find((c) => c.name() === 'repl')!;
    const replHelp = repl.helpInformation();
    expect(replHelp).toContain('/format');
    expect(replHelp).toContain('/stream');
  });
});
