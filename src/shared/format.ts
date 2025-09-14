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
    return cliMarkdown(mdText);
  } catch (error) {
    // Fallback to plain text if markdown parsing fails
    console.warn('Markdown parsing failed, falling back to plain text:', error);
    return mdText;
  }
}
