import { describe, it, expect } from 'vitest';
import { answerHeader, infoFooter } from '../src/shared/ui.js';

describe('answer render blocks', () => {
  it('renders header with model', () => {
    const s = answerHeader('test-model');
    expect(s).toContain('Answer');
    expect(s).toContain('test-model');
  });
  it('renders footer with model and domain host', () => {
    const s = infoFooter({ model: 'm', domain: 'https://openrouter.ai/api/v1' });
    expect(s).toContain('model:');
    expect(s).toContain('domain:');
    expect(s).toContain('openrouter.ai');
  });
});
