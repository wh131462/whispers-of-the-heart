import type { AiProvider } from '@whispers/types';
import { SERVER_DEFAULT_PROVIDER_ID } from '@whispers/types';

/**
 * 内置 Provider 列表 — 不进入 localStorage，每次由代码常量提供。
 * 博主升级默认配置时，所有客户端立即生效。
 */
export const BUILTIN_PROVIDERS: AiProvider[] = [
  {
    id: SERVER_DEFAULT_PROVIDER_ID,
    name: '系统默认',
    description: '使用系统默认的AI配置，仅对登录用户开放，有限额。',
    protocol: 'openai',
    baseUrl: '',
    apiKey: '',
    model: '',
    temperature: 0.7,
    maxTokens: 2048,
    isPreset: true,
    isServerDefault: true,
  },
  {
    id: 'preset-openai',
    name: 'OpenAI',
    description: 'OpenAI 官方接口（需要自带 API Key）',
    protocol: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2048,
    isPreset: true,
  },
  {
    id: 'preset-anthropic',
    name: 'Anthropic',
    description: 'Anthropic Claude 官方接口（需要自带 API Key）',
    protocol: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    model: 'claude-sonnet-4-5',
    temperature: 0.7,
    maxTokens: 2048,
    isPreset: true,
  },
  {
    id: 'preset-deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek 接口（OpenAI 兼容）',
    protocol: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 2048,
    isPreset: true,
  },
  {
    id: 'preset-ollama',
    name: 'Ollama（本地）',
    description: '本地 Ollama 服务（OpenAI 兼容）',
    protocol: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    apiKey: '',
    model: 'llama3',
    temperature: 0.7,
    maxTokens: 2048,
    isPreset: true,
  },
  {
    id: 'preset-custom',
    name: '自定义（OpenAI 兼容）',
    description: '用于其他 OpenAI 兼容服务，请复制为自定义 Provider 后填写',
    protocol: 'openai',
    baseUrl: '',
    apiKey: '',
    model: '',
    temperature: 0.7,
    maxTokens: 2048,
    isPreset: true,
  },
];

/**
 * 合并内置 Provider 与用户自定义 Provider，返回完整列表。
 * 内置项以代码常量为准，用户无法覆盖。
 */
export function getAllProviders(userProviders: AiProvider[]): AiProvider[] {
  return [...BUILTIN_PROVIDERS, ...userProviders];
}
