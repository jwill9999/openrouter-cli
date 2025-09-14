import { describe, it, expect } from 'vitest';
import { renderText } from '../src/shared/format.js';

describe('markdown rendering', () => {
  it('renders headings, lists, and inline code', () => {
    const src = '# Title\n\n- item\n\n`code`';
    const out = renderText(src, { format: 'md', streaming: false });

    // Test basic markdown structure
    expect(out).toContain('Title');
    expect(out).toContain('• item');
    expect(out).toContain('code');

    // Test that it's not just plain text (should have some formatting)
    expect(out).not.toBe(src);

    // Test that cli-markdown processed the content (adds spacing and formatting)
    expect(out).toContain('\n # Title\n');
    expect(out).toContain('\n  • item\n');
  });

  it('handles plain text format', () => {
    const src = '# Title\n\n- item\n\n`code`';
    const out = renderText(src, { format: 'plain', streaming: false });

    // Plain format should return unchanged
    expect(out).toBe(src);
  });

  it('handles streaming mode', () => {
    const src = '# Title\n\n- item\n\n`code`';
    const out = renderText(src, { format: 'md', streaming: true });

    // Streaming mode should return unchanged
    expect(out).toBe(src);
  });
});
