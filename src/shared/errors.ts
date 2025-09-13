import { logError } from './logger.js';
import { spawn } from 'node:child_process';

export const PRIVACY_URL = 'https://openrouter.ai/settings/privacy';

export function isPolicyError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /data policy/i.test(msg) || /Free model publication/i.test(msg);
}

export async function handlePolicyError(opts: {
  where: string;
  tty: boolean;
  interactivePrompt?: boolean;
}): Promise<void> {
  const hint = `This model may require enabling free endpoints that can publish prompts.\nOpen privacy settings: ${PRIVACY_URL}`;
  // Always log details; keep terminal output friendly
  await logError(new Error(`[policy] in ${opts.where}`));
  if (!opts.tty) {
    console.error(hint + "\nTip: run 'openrouter models' to pick another model.");
    return;
  }
  if (opts.interactivePrompt === false) {
    console.error(hint + "\nTip: run 'openrouter models' to pick another model.");
    return;
  }
  try {
    const enq = await import('enquirer');
    const promptFn: any = (enq as any).prompt ?? (enq as any).default?.prompt;
    if (typeof promptFn === 'function') {
      console.error(hint);
      const ans = await promptFn({
        type: 'confirm',
        name: 'open',
        message: 'Open settings now?',
        initial: true,
      });
      if (ans?.open) await openUrl(PRIVACY_URL);
      else console.error("You can also run 'openrouter models' to choose a different model.");
      return;
    }
  } catch {
    // ignore
  }
  console.error(hint);
}

async function openUrl(url: string) {
  const platform = process.platform;
  const trySpawn = (cmd: string, args: string[]) =>
    new Promise<void>((resolve) => {
      const p = spawn(cmd, args, { stdio: 'ignore', detached: true });
      p.on('error', () => resolve());
      p.unref();
      resolve();
    });
  if (platform === 'darwin') return trySpawn('open', [url]);
  if (platform === 'win32') return trySpawn('cmd', ['/c', 'start', '', url]);
  return trySpawn('xdg-open', [url]);
}
