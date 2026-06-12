/**
 * 解析 fetch 返回的 SSE 流。
 *
 * 兼容两种格式：
 * - OpenAI: 仅 `data: { ... }`，以 `data: [DONE]` 结束
 * - Anthropic: `event: <name>\n` + `data: { ... }`
 *
 * 通过 AsyncIterable 暴露原始事件 `{ event?: string; data: string }`。
 */
export async function* parseSSE(
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal
): AsyncIterable<{ event?: string; data: string }> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let buffer = '';

  const onAbort = () => {
    try {
      reader.cancel();
    } catch {
      /* ignore */
    }
  };
  signal?.addEventListener('abort', onAbort);

  try {
    while (true) {
      if (signal?.aborted) return;
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx;
      // SSE 事件以 \n\n 分隔
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const evt = parseEventBlock(raw);
        if (evt) yield evt;
      }
    }
  } finally {
    signal?.removeEventListener('abort', onAbort);
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
}

function parseEventBlock(raw: string): { event?: string; data: string } | null {
  const lines = raw.split('\n').filter(l => l.length > 0);
  if (lines.length === 0) return null;

  let event: string | undefined;
  const dataParts: string[] = [];

  for (const line of lines) {
    if (line.startsWith(':')) continue; // 注释
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataParts.push(line.slice(5).trim());
    }
  }

  if (dataParts.length === 0) return null;
  return { event, data: dataParts.join('\n') };
}
