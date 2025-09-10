export type OutputFormat = "auto" | "plain" | "md";

// Very small markdown → ANSI formatter (headings, lists, code)
export function renderText(input: string, opts: { format: OutputFormat; streaming: boolean }): string {
  const mode = opts.format;
  if (opts.streaming) return input; // keep streaming plain for responsiveness
  if (mode === "plain") return input;
  if (mode === "md" || mode === "auto") return toAnsiMarkdown(input);
  return input;
}

export function toAnsiMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      out.push(ansiDim(""));
      continue;
    }
    if (inFence) {
      out.push(ansiCyan("  " + line));
      continue;
    }
    // Headings
    if (/^###\s+/.test(line)) {
      out.push(ansiBold(line.replace(/^###\s+/, "").trim()));
      continue;
    }
    if (/^##\s+/.test(line)) {
      out.push(ansiBold(line.replace(/^##\s+/, "").trim()));
      continue;
    }
    if (/^#\s+/.test(line)) {
      out.push(ansiBold(line.replace(/^#\s+/, "").trim()));
      continue;
    }
    // Lists
    if (/^\s*[-*+]\s+/.test(line)) {
      line = line.replace(/^\s*[-*+]\s+/, "  • ");
      out.push(line);
      continue;
    }
    // Inline code: `code`
    line = line.replace(/`([^`]+)`/g, (_, m1: string) => ansiDim(m1));
    out.push(line);
  }
  return out.join("\n");
}

// Minimal ANSI helpers
function ansiBold(s: string) {
  return "\x1b[1m" + s + "\x1b[22m";
}
function ansiDim(s: string) {
  return "\x1b[2m" + s + "\x1b[22m";
}
function ansiCyan(s: string) {
  return "\x1b[36m" + s + "\x1b[39m";
}

