type Message = { role: "system" | "user" | "assistant"; content: string };

export type ChatOptions = {
  domain: string;
  apiKey: string;
  model: string;
  system?: string;
  stream?: boolean;
};

export async function testConnection({ domain, apiKey }: { domain: string; apiKey: string }) {
  const url = joinUrl(domain, "models");
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${JSON.stringify(body)}`);
  }
  return await safeJson(res);
}

export async function askOnce(opts: ChatOptions, messages: Message[]): Promise<string> {
  const url = joinUrl(opts.domain, "chat/completions");
  const body = {
    model: opts.model,
    messages: normalizeMessages(opts, messages),
    stream: false,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await safeJson(res);
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${JSON.stringify(errBody)}`);
  }
  const json = await res.json();
  const text: string | undefined = json?.choices?.[0]?.message?.content;
  return text ?? "";
}

export async function streamChat(opts: ChatOptions, messages: Message[]) {
  const url = joinUrl(opts.domain, "chat/completions");
  const body = {
    model: opts.model,
    messages: normalizeMessages(opts, messages),
    stream: true,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const errBody = await safeJson(res);
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${JSON.stringify(errBody)}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of chunk.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const evt = JSON.parse(data);
          const delta: string | undefined = evt?.choices?.[0]?.delta?.content;
          if (delta) process.stdout.write(delta);
        } catch {}
      }
    }
  }
  if (buffer.length) {
    try {
      const evt = JSON.parse(buffer.replace(/^data:\s*/, ""));
      const delta: string | undefined = evt?.choices?.[0]?.delta?.content;
      if (delta) process.stdout.write(delta);
    } catch {}
  }
}

function normalizeMessages(opts: ChatOptions, messages: Message[]) {
  const out: Message[] = [];
  if (opts.system) out.push({ role: "system", content: opts.system });
  out.push(...messages);
  return out;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return await res.text();
  }
}

function joinUrl(base: string, path: string) {
  const u = new URL(base);
  const basePath = u.pathname.replace(/\/+$/, "");
  const rel = path.replace(/^\/+/, "");
  u.pathname = `${basePath}/${rel}`;
  return u;
}

export type { Message };
