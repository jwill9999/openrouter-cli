import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/shared/openrouter.js', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    listModels: vi.fn(async () => ({
      data: [
        { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B Instruct' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'google/gemini-pro', name: 'Gemini Pro' },
        { id: 'microsoft/phi-3-mini', name: 'Phi-3 Mini' },
      ],
    })),
  };
});

import { fuzzyIds, fetchModelsCached, debouncedSuggestFactory } from '../src/shared/models.js';

describe('models helper', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('fuzzyIds ranks id/name and limits results', () => {
    const list = [
      { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B Instruct' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'google/gemini-pro', name: 'Gemini Pro' },
      { id: 'microsoft/phi-3-mini', name: 'Phi-3 Mini' },
    ];
    const ids = fuzzyIds('lla', list, 3);
    expect(ids.length).toBeLessThanOrEqual(3);
    expect(ids[0]).toContain('llama');
  });

  it('fetchModelsCached caches results by ttl', async () => {
    const first = await fetchModelsCached({ domain: 'https://openrouter.ai/api/v1', ttlMs: 60000 });
    const second = await fetchModelsCached({
      domain: 'https://openrouter.ai/api/v1',
      ttlMs: 60000,
    });
    expect(second).toBe(first); // same array instance implies cache hit
  });

  it('debouncedSuggestFactory falls back to default when fetch fails', async () => {
    // Override mock to throw
    const { listModels } = await import('../src/shared/openrouter.js');
    (listModels as any).mockImplementationOnce(async () => {
      throw new Error('offline');
    });
    const suggest = debouncedSuggestFactory({
      domain: 'https://openrouter.ai/api/v1',
      debounceMs: 200,
    });
    const p = suggest('ll');
    vi.advanceTimersByTime(210);
    const out = await p;
    expect(out.length).toBeGreaterThan(0);
  });
});
