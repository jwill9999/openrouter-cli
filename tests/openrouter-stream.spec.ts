import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { streamChat, type ChatOptions } from '../src/shared/openrouter.js';

const realFetch = globalThis.fetch;
const enc = new TextEncoder();

describe('streamChat SSE parsing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    globalThis.fetch = realFetch as any;
  });

  it('writes deltas to stdout for chunks and stops at [DONE]', async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n' +
      'data: {"choices":[{"delta":{"content":"world"}}]}\n\n',
      'data: [DONE]\n\n'
    ];
    const reader = {
      i: 0,
      async read(): Promise<{ done: boolean; value?: Uint8Array }> {
        if (this.i < chunks.length) {
          const v = enc.encode(chunks[this.i++]);
          return { done: false, value: v };
        }
        return { done: true };
      }
    };
    globalThis.fetch = (async () => ({
      ok: true,
      body: { getReader: () => reader }
    })) as any;

    const writes: string[] = [];
    const origWrite = process.stdout.write;
    (process.stdout.write as any) = (s: string | Uint8Array) => {
      const str = typeof s === 'string' ? s : Buffer.from(s).toString('utf8');
      writes.push(str);
      return true;
    };

    try {
      const opts: ChatOptions = { domain: 'https://example.com/v1', apiKey: 'sk', model: 'm', stream: true };
      await streamChat(opts, [{ role: 'user', content: 'hi' }]);
    } finally {
      process.stdout.write = origWrite;
    }
    expect(writes.join('')).toBe('Hello world');
  });
});
