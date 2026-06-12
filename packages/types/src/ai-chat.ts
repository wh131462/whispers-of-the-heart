// AI Chat 相关共享类型

export type AiProtocol = 'openai' | 'anthropic';

export interface AiProvider {
  /** 唯一 ID，`__server_default__` 表示博主服务器默认 */
  id: string;
  /** 显示名 */
  name: string;
  /** 协议风格 */
  protocol: AiProtocol;
  /** 上游基础 URL，例如 https://api.openai.com/v1 */
  baseUrl: string;
  /** 用户提供的 API Key（仅本地存储，不上传） */
  apiKey?: string;
  /** 模型名 */
  model: string;
  /** 采样温度 0-2 */
  temperature: number;
  /** 最大 token 数 */
  maxTokens: number;
  /** 是否为内置预设 */
  isPreset?: boolean;
  /** 是否为博主服务器默认 */
  isServerDefault?: boolean;
  /** 简短描述 */
  description?: string;
}

export type AiMessageRole = 'system' | 'user' | 'assistant';

export interface AiMessage {
  id: string;
  role: AiMessageRole;
  content: string;
  /** 创建时间 ISO */
  createdAt: string;
  /** 是否为正在流式生成中 */
  isStreaming?: boolean;
  /** 错误信息（如有） */
  error?: string;
  /** 本次回答参考的博客来源 */
  sources?: AiSource[];
}

export interface AiSource {
  title: string;
  slug: string;
}

export interface AiConversation {
  id: string;
  title: string;
  messages: AiMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AiKnowledgeHit {
  postId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  snippet: string;
  score: number;
}

export interface AiKnowledgeSearchRequest {
  query: string;
  limit?: number;
}

export interface AiKnowledgeSearchResponse {
  items: AiKnowledgeHit[];
}

export interface AiCompletionsRequest {
  messages: { role: AiMessageRole; content: string }[];
  useKnowledge?: boolean;
  query?: string;
  temperature?: number;
  maxTokens?: number;
}

export const SERVER_DEFAULT_PROVIDER_ID = '__server_default__';
