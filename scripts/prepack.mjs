#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const binPath = path.resolve(process.cwd(), 'bin', 'openrouter');
  try {
    await fs.chmod(binPath, 0o755);
  } catch (err) {
    console.error(err);
    // Best-effort: on Windows or restricted FS, chmod may be unsupported; ignore.
  }
}

main().catch(() => process.exit(0));
