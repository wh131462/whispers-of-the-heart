import type { AIConfig, AIProvider } from '@whispers/ui';

/**
 * AI 配置
 *
 * 通过环境变量配置 AI 功能：
 * - VITE_AI_PROVIDER: AI 提供商 (openai, deepseek, claude, custom)
 * - VITE_AI_MODEL: 模型名称（可选）
 * - VITE_AI_BASE_URL: 自定义 API 基础 URL（可选）
 * - VITE_AI_ENABLED: 是否启用 AI（可选，默认 true）
 *
 * API Key 由后端管理，前端通过代理模式访问 AI 服务
 */

// 从环境变量读取 AI 配置
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER as AIProvider | undefined;
const AI_MODEL = import.meta.env.VITE_AI_MODEL as string | undefined;
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL as string | undefined;
const AI_ENABLED = import.meta.env.VITE_AI_ENABLED !== 'false';
const API_URL = import.meta.env.VITE_API_URL as string | undefined;

/**
 * 检查 AI 配置是否可用
 */
export function isAIConfigAvailable(): boolean {
  return !!(AI_PROVIDER && AI_ENABLED && API_URL);
}

/**
 * 获取 AI 配置
 * 如果配置不可用，返回 undefined
 */
export function getAIConfig(): AIConfig | undefined {
  if (!isAIConfigAvailable()) {
    return undefined;
  }

  // 根据提供商设置默认模型
  const defaultModels: Record<AIProvider, string> = {
    openai: 'gpt-4o-mini',
    deepseek: 'deepseek-chat',
    claude: 'claude-3-5-sonnet-20241022',
    custom: '',
  };

  const provider = AI_PROVIDER as AIProvider;
  const model = AI_MODEL || defaultModels[provider] || '';

  return {
    provider,
    model,
    baseURL: AI_BASE_URL,
    enabled: AI_ENABLED,
    proxyUrl: `${API_URL}/api/v1/ai-proxy`,
  };
}

/**
 * AI 配置示例（用于文档说明）
 */
export const AI_CONFIG_EXAMPLES = {
  openai: {
    provider: 'openai' as const,
    model: 'gpt-4o-mini',
  },
  deepseek: {
    provider: 'deepseek' as const,
    model: 'deepseek-chat',
  },
  claude: {
    provider: 'claude' as const,
    model: 'claude-3-5-sonnet-20241022',
  },
  custom: {
    provider: 'custom' as const,
    model: 'your-model',
    baseURL: 'https://your-api.com/v1',
  },
};
