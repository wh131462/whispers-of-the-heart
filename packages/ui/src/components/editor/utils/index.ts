/**
 * 编辑器工具模块统一导出
 */

// 类型
export type {
  MediaPickerRequest,
  MediaBlockInfo,
  CodeBlockInfo,
  MindMapBlockInfo,
} from './types';

// 配置
export {
  getApiBaseUrl,
  API_BASE_URL,
  DEFAULT_UPLOAD_ENDPOINT,
  MEDIA_BLOCK_TYPES,
  MEDIA_TYPE_NAMES,
  MEDIA_TYPE_MAP,
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
  SLASH_MENU_GROUP_ORDER,
  SLASH_MENU_GROUP_MAPPING,
  EXCLUDED_SLASH_MENU_ITEMS,
} from './config';

// Markdown 工具
export {
  fixTableMarkdown,
  extractCodeBlocks,
  fixCodeBlocksInMarkdown,
  extractMindMapBlocks,
  fixMindMapBlocksInMarkdown,
  extractMediaBlocks,
  fixMediaBlocksInMarkdown,
  preprocessMarkdownForMindMap,
  applyAllMarkdownFixes,
} from './markdown-utils';

// Slash Menu 工具
export {
  createCustomMediaItems,
  createAdvancedItems,
  createQuoteItem,
  filterDefaultSlashMenuItems,
  remapGroupNames,
  sortByGroupOrder,
  getFullCustomSlashMenuItems,
  getCommentSlashMenuItems,
} from './slash-menu-items';
