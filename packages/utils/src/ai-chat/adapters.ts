import type { AiMessage, AiMessageRole, AiProvider } from '@whispers/types';
import { parseSSE } from './sse';

export interface AdapterChatOptions {
  signal?: AbortSignal;
  /** 系统提示，会作为 system 消息处理 */
  systemPrompt?: string;
  /** 通过 ai-proxy 转发时使用的 fetch（注入鉴权） */
  fetchImpl?: typeof fetch;
  /** ai-proxy 端点，例如 `/api/v1/ai-proxy/proxy?url=` */
  proxyEndpoint?: string;
}

export interface AiAdapter {
  /** 流式对话，返回每次新增的文本 token */
  chat(
    messages: AiMessage[],
    provider: AiProvider,
    options?: AdapterChatOptions
  ): AsyncIterable<string>;
}

function toSimpleMessages(
  messages: AiMessage[]
): { role: AiMessageRole; content: string }[] {
  return messages.map(m => ({ role: m.role, content: m.content }));
}

async function postViaProxy(
  targetUrl: string,
  body: unknown,
  options: AdapterChatOptions
): Promise<Response> {
  const endpoint = options.proxyEndpoint ?? '/api/v1/ai-proxy/proxy';
  const f = options.fetchImpl ?? fetch;
  const fullUrl = `${endpoint}?url=${encodeURIComponent(targetUrl)}`;
  return f(fullUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: options.signal,
  });
}

export const OpenAIAdapter: AiAdapter = {
  async *chat(messages, provider, options = {}) {
    const baseUrl = provider.baseUrl.replace(/\/$/, '');
    const url = `${baseUrl}/chat/completions`;
    const simpleMessages = toSimpleMessages(messages);
    if (options.systemPrompt) {
      simpleMessages.unshift({ role: 'system', content: options.systemPrompt });
    }
    const body = {
      model: provider.model,
      messages: simpleMessages,
      stream: true,
      temperature: provider.temperature,
      max_tokens: provider.maxTokens,
    };

    const res = await postViaProxy(url, body, options);
    if (!res.ok || !res.body) {
      const txt = await res.text().catch(() => '');
      throw new Error(`OpenAI 上游错误 ${res.status}: ${txt.slice(0, 200)}`);
    }

    for await (const evt of parseSSE(res.body, options.signal)) {
      const data = evt.data;
      if (!data || data === '[DONE]') {
        if (data === '[DONE]') return;
        continue;
      }
      try {
        const json = JSON.parse(data);
        const delta = json?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta.length > 0) {
          yield delta;
        }
      } catch {
        // 跳过不完整的事件
      }
    }
  },
};

export const AnthropicAdapter: AiAdapter = {
  async *chat(messages, provider, options = {}) {
    const baseUrl = provider.baseUrl.replace(/\/$/, '');
    const url = `${baseUrl}/messages`;
    // Anthropic system 是顶层字段
    const simpleMessages = toSimpleMessages(messages).filter(
      m => m.role !== 'system'
    );
    // 从 messages 中抽取 system（用户传入的）
    const systemFromMessages = toSimpleMessages(messages)
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n');
    const systemPrompt =
      [options.systemPrompt, systemFromMessages].filter(Boolean).join('\n') ||
      undefined;

    const body: Record<string, unknown> = {
      model: provider.model,
      messages: simpleMessages,
      stream: true,
      max_tokens: provider.maxTokens,
      temperature: provider.temperature,
    };
    if (systemPrompt) body.system = systemPrompt;

    const res = await postViaProxy(url, body, options);
    if (!res.ok || !res.body) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Anthropic 上游错误 ${res.status}: ${txt.slice(0, 200)}`);
    }

    for await (const evt of parseSSE(res.body, options.signal)) {
      if (evt.event === 'content_block_delta') {
        try {
          const json = JSON.parse(evt.data);
          const text = json?.delta?.text;
          if (typeof text === 'string' && text.length > 0) {
            yield text;
          }
        } catch {
          /* ignore */
        }
      } else if (evt.event === 'message_stop') {
        return;
      }
    }
  },
};

export function getAdapter(protocol: 'openai' | 'anthropic'): AiAdapter {
  return protocol === 'anthropic' ? AnthropicAdapter : OpenAIAdapter;
}
