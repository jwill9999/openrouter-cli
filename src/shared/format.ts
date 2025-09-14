// @ts-ignore - cli-markdown doesn't have types
import cliMarkdown from 'cli-markdown';

export type OutputFormat = 'auto' | 'plain' | 'md';

// Markdown → ANSI formatter using cli-markdown
export function renderText(
  input: string,
  opts: { format: OutputFormat; streaming: boolean }
): string {
  const mode = opts.format;
  if (opts.streaming) return input; // keep streaming plain for responsiveness
  if (mode === 'plain') return input;
  if (mode === 'md' || mode === 'auto') return toAnsiMarkdown(input);
  return input;
}

export function toAnsiMarkdown(mdText: string): string {
  try {
    // Set FORCE_COLOR to ensure colors are output even in non-TTY environments
    const originalForceColor = process.env.FORCE_COLOR;
    process.env.FORCE_COLOR = '1';

    const result = cliMarkdown(mdText);

    // Restore original value
    if (originalForceColor === undefined) {
      delete process.env.FORCE_COLOR;
    } else {
      process.env.FORCE_COLOR = originalForceColor;
    }

    return result;
  } catch (error) {
    // Fallback to plain text if markdown parsing fails
    console.warn('Markdown parsing failed, falling back to plain text:', error);
    return mdText;
  }
}
