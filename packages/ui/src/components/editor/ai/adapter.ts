import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';
import { AIConfig, getFullAIConfig, PROVIDER_DEFAULTS } from './types';

/**
 * 根据 AI 配置创建语言模型实例
 */
export function createLanguageModel(config: AIConfig): LanguageModel {
  const fullConfig = getFullAIConfig(config);

  switch (fullConfig.provider) {
    case 'openai': {
      const openai = createOpenAI({
        apiKey: fullConfig.apiKey,
        baseURL: fullConfig.baseURL || PROVIDER_DEFAULTS.openai.baseURL,
      });
      return openai(fullConfig.model);
    }

    case 'deepseek': {
      // DeepSeek 使用 OpenAI 兼容的 API
      const deepseek = createOpenAICompatible({
        name: 'deepseek',
        apiKey: fullConfig.apiKey,
        baseURL: fullConfig.baseURL || PROVIDER_DEFAULTS.deepseek.baseURL,
      });
      return deepseek(fullConfig.model);
    }

    case 'claude': {
      const anthropic = createAnthropic({
        apiKey: fullConfig.apiKey,
        baseURL: fullConfig.baseURL || PROVIDER_DEFAULTS.claude.baseURL,
      });
      return anthropic(fullConfig.model);
    }

    case 'custom': {
      // 自定义提供商使用 OpenAI 兼容 API
      if (!fullConfig.baseURL) {
        throw new Error('Custom provider requires baseURL');
      }
      const custom = createOpenAICompatible({
        name: 'custom',
        apiKey: fullConfig.apiKey,
        baseURL: fullConfig.baseURL,
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
  if (!config.apiKey) {
    return { valid: false, error: 'API key is required' };
  }

  if (!config.model) {
    return { valid: false, error: 'Model name is required' };
  }

  if (config.provider === 'custom' && !config.baseURL) {
    return { valid: false, error: 'Base URL is required for custom provider' };
  }

  return { valid: true };
}
