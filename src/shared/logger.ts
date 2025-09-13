import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureConfigDir, paths } from './config.js';

function formatError(err: unknown): string {
  if (err instanceof Error) return err.stack || err.message || String(err);
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export async function logError(err: unknown, context?: string): Promise<void> {
  try {
    await ensureConfigDir();
    const file = path.join(paths.CONFIG_DIR, 'cli.log');
    const line = `[${new Date().toISOString()}]${context ? ' ' + context : ''} ${formatError(err)}\n`;
    try {
      await fs.appendFile(file, line, { encoding: 'utf8' });
    } catch (e: any) {
      if (e?.code === 'ENOENT') {
        await fs.writeFile(file, line, { encoding: 'utf8', mode: 0o600 });
      } else {
        // swallow logging errors
      }
    }
  } catch {
    // swallow all logging errors
  }
}
