import { describe, it, expect } from 'vitest';
import { renderText } from '../src/shared/format.js';

describe('markdown rendering (ANSI)', () => {
  it('renders headings, lists, and inline code with ANSI', () => {
    const src = '# Title\n\n- item\n\n`code`';
    const out = renderText(src, { format: 'md', streaming: false });
    // Bold heading (\x1b[1m ... \x1b[22m)
    expect(out).toMatch(/\x1b\[1m.*Title.*\x1b\[22m/);
    // Bullet replacement
    expect(out).toContain('• item');
    // Inline code dim
    expect(out).toMatch(/\x1b\[2mcode\x1b\[22m/);
  });
});
