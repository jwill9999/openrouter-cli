import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { askOnce, type ChatOptions } from '../src/shared/openrouter.js';

const realFetch = globalThis.fetch;

describe('askOnce error handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    globalThis.fetch = realFetch as any;
  });

  it('throws HTTP error with JSON body', async () => {
    globalThis.fetch = (async () => ({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error: 'test-error' }),
    })) as any;

    const opts: ChatOptions = {
      domain: 'https://example.com/v1',
      apiKey: 'sk-test',
      model: 'm',
      stream: false,
    };
    await expect(askOnce(opts, [{ role: 'user', content: 'hi' }])).rejects.toThrow(
      /HTTP 400 Bad Request: .*test-error.*/
    );
  });
});
