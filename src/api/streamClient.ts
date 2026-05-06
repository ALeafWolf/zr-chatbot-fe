const BASE_URL = import.meta.env.VITE_BACKEND_ORIGIN ?? "";

export interface StreamHandlers {
  onEvent: (event: string, data: unknown) => void;
  signal?: AbortSignal;
}

/**
 * POST SSE consumer — `EventSource` cannot POST, so we parse chunked text manually.
 */
export async function postMessagesStream(
  sessionId: string,
  content: string,
  handlers: StreamHandlers,
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/sessions/${encodeURIComponent(sessionId)}/messages/stream`,
    {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
      signal: handlers.signal,
    },
  );

  if (!res.ok) {
    let msg = `Stream failed: ${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const j = JSON.parse(text) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          msg = text;
        }
      }
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let carry = "";

  const flushBlock = (block: string) => {
    let eventName = "message";
    const dataLines: string[] = [];
    for (const rawLine of block.split(/\r?\n/)) {
      const line = rawLine.trimEnd();
      if (!line || line.startsWith(":")) continue;
      if (line.startsWith("event:")) {
        eventName = line.slice("event:".length).trim();
        continue;
      }
      if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).trimStart());
      }
    }
    if (!dataLines.length) return;
    const payloadText = dataLines.join("\n");
    let parsed: unknown = payloadText;
    try {
      parsed = JSON.parse(payloadText) as unknown;
    } catch {
      parsed = payloadText;
    }
    handlers.onEvent(eventName, parsed);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });

    let sepIdx: number;
    while ((sepIdx = carry.indexOf("\n\n")) !== -1) {
      const block = carry.slice(0, sepIdx).trimEnd();
      carry = carry.slice(sepIdx + 2);
      if (block.length) flushBlock(block);
    }
  }

  const tail = carry.trimEnd();
  if (tail.length) flushBlock(tail);
}
