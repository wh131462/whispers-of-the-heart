/**
 * AI 提供商类型
 */
export type AIProvider = 'openai' | 'deepseek' | 'claude' | 'custom';

/**
 * AI 配置接口
 */
export interface AIConfig {
  /**
   * AI 提供商类型
   */
  provider: AIProvider;

  /**
   * API 密钥（直连模式必填，代理模式不需要）
   */
  apiKey?: string;

  /**
   * API 基础 URL（可选，用于自定义端点）
   * - OpenAI 默认: https://api.openai.com/v1
   * - DeepSeek 默认: https://api.deepseek.com/v1
   * - Claude 默认: https://api.anthropic.com/v1
   */
  baseURL?: string;

  /**
   * 模型名称
   * - OpenAI: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo 等
   * - DeepSeek: deepseek-chat, deepseek-coder 等
   * - Claude: claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022 等
   */
  model: string;

  /**
   * 是否启用 AI 功能
   */
  enabled?: boolean;

  /**
   * 代理端点 URL（设置后使用代理模式，API Key 由后端管理）
   * 例: http://localhost:7777/api/v1/ai-proxy
   */
  proxyUrl?: string;

  /**
   * JWT 认证令牌（代理模式下用于后端鉴权）
   */
  authToken?: string;
}

/**
 * 预设的提供商配置
 */
export const PROVIDER_DEFAULTS: Record<
  Exclude<AIProvider, 'custom'>,
  { baseURL: string; defaultModel: string }
> = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  claude: {
    baseURL: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
};

/**
 * 获取完整的 AI 配置（填充默认值）
 */
export function getFullAIConfig(config: AIConfig): Required<AIConfig> {
  const provider = config.provider;

  if (provider === 'custom') {
    return {
      provider: config.provider,
      apiKey: config.apiKey || '',
      baseURL: config.baseURL || '',
      model: config.model,
      enabled: config.enabled ?? true,
      proxyUrl: config.proxyUrl || '',
      authToken: config.authToken || '',
    };
  }

  const defaults = PROVIDER_DEFAULTS[provider];

  return {
    provider: config.provider,
    apiKey: config.apiKey || '',
    baseURL: config.baseURL || defaults.baseURL,
    model: config.model || defaults.defaultModel,
    enabled: config.enabled ?? true,
    proxyUrl: config.proxyUrl || '',
    authToken: config.authToken || '',
  };
}
