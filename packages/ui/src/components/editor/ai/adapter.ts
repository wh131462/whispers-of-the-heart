import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';
import { AIConfig, getFullAIConfig, PROVIDER_DEFAULTS } from './types';

/**
 * 创建代理 fetch 函数
 * 将 AI SDK 的请求重定向到后端代理端点
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

    return globalThis.fetch(proxyEndpoint, {
      ...init,
      headers,
    });
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
