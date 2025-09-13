import { resolveConfig } from './config.js';
import { listModels } from './openrouter.js';
import { isColorSupported } from './ui.js';
import ora from 'ora';
import type { Ora } from 'ora';
import Fuse from 'fuse.js';

export type ModelMeta = { id: string; name?: string; [k: string]: any };

type Cache = { data: ModelMeta[]; expiresAt: number } | undefined;
let cache: Cache;
let inflight: Promise<ModelMeta[]> | null = null;

export async function fetchModelsCached(opts: {
  domain: string;
  apiKey?: string;
  ttlMs?: number;
}): Promise<ModelMeta[]> {
  const ttl = Math.max(1000, opts.ttlMs ?? 60_000);
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.data;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await listModels({ domain: opts.domain, apiKey: opts.apiKey });
      const data: ModelMeta[] = Array.isArray((res as any)?.data) ? (res as any).data : [];
      cache = { data, expiresAt: now + ttl };
      return data;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function fuzzyIds(input: string, list: ModelMeta[], limit = 25): string[] {
  if (!input) return list.slice(0, limit).map((m) => m.id);
  const fuse = new Fuse(list, {
    keys: ['id', 'name'],
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
  });
  return fuse
    .search(input)
    .slice(0, limit)
    .map((r) => r.item.id);
}

export function debouncedSuggestFactory(args: {
  domain: string;
  apiKey?: string;
  debounceMs?: number;
  spinnerLabel?: string;
}) {
  const debounceMs = Math.max(0, args.debounceMs ?? 200);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingResolve: ((ids: string[]) => void) | null = null;
  let spinner: Ora | null = null;

  const defaultModel = async () => {
    const env = process.env.OPENROUTER_MODEL;
    if (env) return env;
    const eff = await resolveConfig();
    return eff.model || 'openrouter/auto';
  };

  async function run(query: string): Promise<string[]> {
    try {
      const list = await fetchModelsCached({ domain: args.domain, apiKey: args.apiKey });
      const matches = fuzzyIds(query, list);
      const custom = query && !matches.includes(query) ? [query] : [];
      return [...custom, ...(matches.length ? matches : [await defaultModel()])];
    } catch {
      return [await defaultModel()];
    }
  }

  return async (input: string): Promise<string[]> => {
    if (pendingResolve) {
      pendingResolve = null;
    }
    if (timer) clearTimeout(timer);

    if ((input?.length ?? 0) >= 2 && process.stdout.isTTY) {
      if (!spinner) {
        spinner = ora({
          text: args.spinnerLabel || 'Searching models…',
          isEnabled: isColorSupported(),
        });
        spinner.start();
      } else if (!spinner.isSpinning) {
        spinner.start();
      }
    }

    return new Promise<string[]>((resolve) => {
      pendingResolve = resolve;
      timer = setTimeout(async () => {
        const out = await run(input);
        if (spinner) {
          spinner.stop();
        }
        if (pendingResolve) pendingResolve(out);
        pendingResolve = null;
      }, debounceMs);
    });
  };
}
