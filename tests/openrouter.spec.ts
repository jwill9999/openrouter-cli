import { describe, it, expect } from 'vitest';
import { joinUrl } from '../src/shared/openrouter.js';

describe('joinUrl', () => {
  it('preserves base path when joining', () => {
    expect(joinUrl('https://openrouter.ai/api/v1', 'models').toString()).toBe(
      'https://openrouter.ai/api/v1/models'
    );
  });

  it('handles trailing and leading slashes correctly', () => {
    expect(joinUrl('https://example.com/root/', '/chat/completions').toString()).toBe(
      'https://example.com/root/chat/completions'
    );
  });
});
