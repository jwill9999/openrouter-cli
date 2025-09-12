import { describe, it, expect } from 'vitest';
import { buildProgram } from '../src/main.js';

describe('styled help output additions', () => {
  it('includes banner text (description) and commands', () => {
    const program = buildProgram();
    const help = program.helpInformation();
    expect(help).toContain('OpenRouter CLI');
    expect(help).toContain('Commands:');
  });
});
