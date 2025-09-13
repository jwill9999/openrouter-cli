import boxen from 'boxen';
import chalk from 'chalk';
import ora from 'ora';

// Color/TTY detection
export function isColorSupported(): boolean {
  const noColor = !!process.env.NO_COLOR;
  const outTty = !!process.stdout && !!process.stdout.isTTY;
  const errTty = !!(process as any).stderr && !!(process as any).stderr.isTTY;
  return !noColor && (outTty || errTty);
}

const color = isColorSupported();

// Palette and style helpers (color-safe)
export const palette = {
  accent: (s: string) => (color ? chalk.cyan(s) : s),
  accent2: (s: string) => (color ? chalk.magenta(s) : s),
  ok: (s: string) => (color ? chalk.green(s) : s),
  warn: (s: string) => (color ? chalk.yellow(s) : s),
  err: (s: string) => (color ? chalk.red(s) : s),
  dim: (s: string) => (color ? chalk.dim(s) : s),
  bold: (s: string) => (color ? chalk.bold(s) : s),
};

export function banner(): string {
  // Keep ASCII and under 12 lines
  const title = palette.bold('OpenRouter CLI');
  const subtitle = palette.dim('OpenAI-compatible');
  const body = `${title}\n${subtitle}`;
  return boxen(body, {
    padding: { top: 0, right: 2, bottom: 0, left: 2 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    borderStyle: 'round',
  });
}

export function examplesBox(): string {
  // Simple ASCII table without extra deps for stability
  const rows: Array<[string, string]> = [
    ['ask', 'openrouter ask "Hello" --no-stream'],
    ['repl', 'openrouter repl'],
    ['init', 'openrouter init'],
    ['config', 'openrouter config --api-key sk-...'],
    ['test', 'openrouter test'],
  ];
  const header = `${palette.bold('Examples')}`;
  const col1Width = Math.max(...rows.map((r) => r[0].length), 'Command'.length) + 2;
  const lines = [
    `${pad('Command', col1Width)}Example`,
    `${'-'.repeat(col1Width)}${'-'.repeat(32)}`,
    ...rows.map(([c, ex]) => `${pad(c, col1Width)}${ex}`),
  ].join('\n');
  return boxen(`${header}\n${lines}`, {
    padding: 1,
    borderStyle: 'single',
  });
}

function pad(s: string, w: number) {
  if (s.length >= w) return s;
  return s + ' '.repeat(w - s.length);
}

export function attachStyledHelp(program: import('commander').Command) {
  // Use beforeAll to ensure inclusion in helpInformation()
  program.addHelpText('beforeAll', banner() + '\n' + examplesBox() + '\n');
}

export function answerHeader(model: string): string {
  const head = `${palette.accent('Answer')} ${palette.dim('—')} ${palette.bold(model)}`;
  return boxen(head, { padding: { top: 0, right: 1, bottom: 0, left: 1 }, borderStyle: 'classic' });
}

export function infoFooter(info: { model: string; domain: string }): string {
  const url = tryHost(info.domain);
  const text = `${palette.dim('model:')} ${palette.bold(info.model)}  ${palette.dim('•')}  ${palette.dim('domain:')} ${url}`;
  return boxen(text, { padding: { top: 0, right: 1, bottom: 0, left: 1 }, borderStyle: 'single' });
}

function tryHost(d: string) {
  try {
    const u = new URL(d);
    return u.host + u.pathname.replace(/\/$/, '');
  } catch {
    return d;
  }
}

export function styledPrompt(model: string): string {
  const m = palette.accent(`(${model})`);
  const arrow = palette.dim('>');
  return `${m} ${arrow} `;
}

export function tipBox(): string {
  const lines = [
    palette.dim("Type 'exit' to quit. Commands: ") +
      '/model <name>, /system <text>, /format <md|plain>, /stream <on|off>, /stats, /billing',
    palette.dim("Use 'openrouter init' to change defaults."),
  ].join('\n');
  return boxen(lines, { padding: 1, borderStyle: 'single' });
}

export function showSpinner(label: string) {
  const enabled = isColorSupported();
  const spinner = ora({
    text: palette.dim(label),
    isEnabled: enabled,
    stream: process.stderr as any,
  });
  return spinner;
}

export function warnBox(text: string): string {
  // Emphasize with red text and a clear border; remains readable without color
  const body = palette.err(text);
  return boxen(body, { padding: 1, borderStyle: 'round' });
}
