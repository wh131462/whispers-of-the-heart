import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';
import { AIConfig, getFullAIConfig, PROVIDER_DEFAULTS } from './types';

/**
 * 缓冲流式响应并合并 tool call arguments
 *
 * @blocknote/xl-ai 的 partial JSON 解析在遇到代码内容中的 { } " \n 等字符时会失败，
 * 导致同一个代码块被拆成多个重复块。
 *
 * 解决方案：保留 stream: true，缓冲完整的流式响应后，
 * 将所有 tool call argument 碎片合并为单个完整的 SSE 事件重新发送。
 * 这样 partial JSON 解析器一次性收到完整 JSON，不再产生中间失败状态。
 */
async function bufferAndCombineToolCallStream(
  response: Response
): Promise<Response> {
  if (!response.body) {
    return response;
  }

  // 缓冲完整的 SSE 流
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += decoder.decode(value, { stream: true });
  }
  fullText += decoder.decode(); // flush

  // 创建原始内容回退 Response 的辅助函数
  const createFallbackResponse = () => {
    const enc = new TextEncoder();
    const s = new ReadableStream({
      start(controller) {
        controller.enqueue(enc.encode(fullText));
        controller.close();
      },
    });
    return new Response(s, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };

  try {
    // 统一行尾为 \n（HTTP 响应可能使用 \r\n 或 \r）
    fullText = fullText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 解析 SSE 事件
    const sseDataChunks: string[] = [];
    const lines = fullText.split('\n');
    let currentData = '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        currentData = line.slice(6);
      } else if (line === '' && currentData) {
        sseDataChunks.push(currentData);
        currentData = '';
      }
    }
    // 处理流末尾没有空行的情况
    if (currentData) {
      sseDataChunks.push(currentData);
    }

    // 如果没有解析出任何 SSE 事件，说明可能不是 SSE 格式，原样返回
    if (sseDataChunks.length === 0) {
      console.warn('[AI-Buffer] No SSE events parsed, returning original');
      return createFallbackResponse();
    }

    console.warn('[AI-Buffer] Parsed SSE events:', sseDataChunks.length);

    // 收集 tool call 信息

    const toolCallArgs: Record<number, string> = {};
    const toolCallMeta: Record<number, { id: string; name: string }> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let baseChunkTemplate: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nonToolCallEvents: any[] = [];
    let finishReason: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let usageEvent: any = null;
    let hasToolCalls = false;

    for (const data of sseDataChunks) {
      if (data === '[DONE]') continue;

      try {
        const json = JSON.parse(data);
        const choice = json.choices?.[0];

        // 无 choices 的事件（如 usage）
        if (!choice && json.usage) {
          usageEvent = json;
          continue;
        }
        if (!choice) continue;

        // 记录 finish_reason（不跳过，因为同一 chunk 可能还包含 tool_calls）
        if (choice.finish_reason) {
          finishReason = choice.finish_reason;
        }

        const delta = choice.delta;
        if (!delta) continue;

        // tool call 事件：收集碎片
        if (delta.tool_calls?.length) {
          hasToolCalls = true;
          if (!baseChunkTemplate) {
            const { choices: _c, ...rest } = json;
            baseChunkTemplate = rest;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const tc of delta.tool_calls as any[]) {
            const idx: number = tc.index ?? 0;
            if (tc.id) {
              toolCallMeta[idx] = {
                id: tc.id,
                name: tc.function?.name || '',
              };
            }
            if (tc.function?.arguments) {
              toolCallArgs[idx] =
                (toolCallArgs[idx] || '') + tc.function.arguments;
            }
            if (tc.function?.name && toolCallMeta[idx]) {
              toolCallMeta[idx].name =
                toolCallMeta[idx].name || tc.function.name;
            }
          }
          continue;
        }

        // 非 tool call 且非 finish 事件（content / reasoning 等），原样保留
        if (!choice.finish_reason) {
          nonToolCallEvents.push(json);
        }
      } catch {
        // JSON 解析失败的行，忽略
      }
    }

    // 如果没有 tool call 事件，说明不需要合并，原样返回缓冲内容
    if (!hasToolCalls) {
      console.warn('[AI-Buffer] No tool calls found, returning original');
      return createFallbackResponse();
    }

    const toolCallIndices = Object.keys(toolCallMeta)
      .map(Number)
      .sort((a, b) => a - b);

    console.warn(
      '[AI-Buffer] Combining tool calls:',
      toolCallIndices.map(idx => ({
        idx,
        id: toolCallMeta[idx].id,
        name: toolCallMeta[idx].name,
        argsLen: (toolCallArgs[idx] || '').length,
      }))
    );

    // 验证合并后的 arguments 是否为有效 JSON
    for (const idx of toolCallIndices) {
      try {
        JSON.parse(toolCallArgs[idx] || '');
      } catch {
        console.error(
          `[AI-Buffer] Tool call ${idx} arguments is not valid JSON:`,
          (toolCallArgs[idx] || '').substring(0, 200)
        );
      }
    }

    // 重建 SSE 事件
    const reconstructed: string[] = [];
    const template = baseChunkTemplate || {
      id: 'chatcmpl-combined',
      object: 'chat.completion.chunk',
      model: '',
    };

    // 事件 1：tool call 开始（role + name + id，空 arguments）
    if (toolCallIndices.length > 0) {
      reconstructed.push(
        `data: ${JSON.stringify({
          ...template,
          choices: [
            {
              index: 0,
              delta: {
                role: 'assistant',
                content: null,
                tool_calls: toolCallIndices.map(idx => ({
                  index: idx,
                  id: toolCallMeta[idx].id,
                  type: 'function',
                  function: {
                    name: toolCallMeta[idx].name,
                    arguments: '',
                  },
                })),
              },
              finish_reason: null,
            },
          ],
        })}\n\n`
      );

      // 事件 2：每个 tool call 的完整 arguments（一次性发送）
      for (const idx of toolCallIndices) {
        reconstructed.push(
          `data: ${JSON.stringify({
            ...template,
            choices: [
              {
                index: 0,
                delta: {
                  tool_calls: [
                    {
                      index: idx,
                      function: {
                        arguments: toolCallArgs[idx] || '',
                      },
                    },
                  ],
                },
                finish_reason: null,
              },
            ],
          })}\n\n`
        );
      }
    }

    // 非 tool call 事件原样输出
    for (const event of nonToolCallEvents) {
      reconstructed.push(`data: ${JSON.stringify(event)}\n\n`);
    }

    // finish_reason 事件（重建干净的 finish 事件，避免重复的 tool_calls delta）
    reconstructed.push(
      `data: ${JSON.stringify({
        ...template,
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: finishReason || 'stop',
          },
        ],
      })}\n\n`
    );

    // usage 事件
    if (usageEvent) {
      reconstructed.push(`data: ${JSON.stringify(usageEvent)}\n\n`);
    }

    // [DONE]
    reconstructed.push('data: [DONE]\n\n');

    console.warn('[AI-Buffer] Reconstructed events:', reconstructed.length);

    // 创建新的流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(reconstructed.join('')));
        controller.close();
      },
    });

    return new Response(stream, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (err) {
    console.error(
      '[AI-Buffer] Unexpected error, falling back to original:',
      err
    );
    return createFallbackResponse();
  }
}

/**
 * 创建代理 fetch 函数
 * 将 AI SDK 的请求重定向到后端代理端点
 *
 * 对于包含 tools 的流式请求，缓冲完整响应后合并 tool call arguments，
 * 以避免 @blocknote/xl-ai 的 partial JSON 解析因代码块内容而创建重复块
 */
function createProxyFetch(
  proxyUrl: string,
  authToken: string
): typeof globalThis.fetch {
  return async (
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> => {
    const targetUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const proxyEndpoint = `${proxyUrl}/proxy?url=${encodeURIComponent(targetUrl)}`;

    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${authToken}`);

    // 检测是否为包含 tools 的流式请求
    let isStreamingToolCall = false;
    if (typeof init?.body === 'string') {
      try {
        const bodyJson = JSON.parse(init.body);
        isStreamingToolCall =
          bodyJson.stream === true && bodyJson.tools?.length > 0;
      } catch {
        // 非 JSON body，不做处理
      }
    }

    // 发起请求（保持 stream: true 不变）
    const response = await globalThis.fetch(proxyEndpoint, {
      ...init,
      headers,
    });

    // 非 tool call 流式请求或请求失败，直接返回
    if (!isStreamingToolCall || !response.ok) {
      return response;
    }

    // 缓冲流式响应并合并 tool call arguments
    return bufferAndCombineToolCallStream(response);
  };
}

/**
 * 根据 AI 配置创建语言模型实例
 */
export function createLanguageModel(config: AIConfig): LanguageModel {
  const fullConfig = getFullAIConfig(config);
  const isProxy = !!fullConfig.proxyUrl && !!fullConfig.authToken;
  const fetchOption = isProxy
    ? createProxyFetch(fullConfig.proxyUrl, fullConfig.authToken)
    : undefined;
  // 代理模式下使用占位 apiKey（实际由后端注入）
  const apiKey = isProxy ? 'proxy-managed' : fullConfig.apiKey;

  switch (fullConfig.provider) {
    case 'openai': {
      const openai = createOpenAI({
        apiKey,
        baseURL: fullConfig.baseURL || PROVIDER_DEFAULTS.openai.baseURL,
        ...(fetchOption ? { fetch: fetchOption } : {}),
      });
      return openai(fullConfig.model);
    }

    case 'deepseek': {
      const deepseek = createOpenAICompatible({
        name: 'deepseek',
        apiKey: apiKey || '',
        baseURL: fullConfig.baseURL || PROVIDER_DEFAULTS.deepseek.baseURL,
        ...(fetchOption ? { fetch: fetchOption } : {}),
      });
      return deepseek(fullConfig.model);
    }

    case 'claude': {
      const anthropic = createAnthropic({
        apiKey: apiKey || '',
        baseURL: fullConfig.baseURL || PROVIDER_DEFAULTS.claude.baseURL,
        ...(fetchOption ? { fetch: fetchOption } : {}),
      });
      return anthropic(fullConfig.model);
    }

    case 'custom': {
      if (!fullConfig.baseURL) {
        throw new Error('Custom provider requires baseURL');
      }
      const custom = createOpenAICompatible({
        name: 'custom',
        apiKey: apiKey || '',
        baseURL: fullConfig.baseURL,
        ...(fetchOption ? { fetch: fetchOption } : {}),
      });
      return custom(fullConfig.model);
    }

    default:
      throw new Error(`Unsupported AI provider: ${fullConfig.provider}`);
  }
}

/**
 * 验证 AI 配置是否有效
 */
export function validateAIConfig(config: AIConfig): {
  valid: boolean;
  error?: string;
} {
  if (!config.model) {
    return { valid: false, error: 'Model name is required' };
  }

  // 代理模式：需要 proxyUrl
  if (config.proxyUrl) {
    return { valid: true };
  }

  // 直连模式：需要 apiKey
  if (!config.apiKey) {
    return { valid: false, error: 'API key or proxy URL is required' };
  }

  if (config.provider === 'custom' && !config.baseURL) {
    return { valid: false, error: 'Base URL is required for custom provider' };
  }

  return { valid: true };
}
