/**
 * 编辑器共享配置
 */

/** 获取 API 基础 URL */
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const env = (import.meta as any)?.env || {};
      if (env.VITE_API_URL) {
        return env.VITE_API_URL;
      }
    } catch {
      // ignore
    }
  }
  return 'http://localhost:7777';
};

/** API 基础 URL */
export const API_BASE_URL = getApiBaseUrl();

/** 默认上传端点 */
export const DEFAULT_UPLOAD_ENDPOINT = `${API_BASE_URL}/api/v1/media/upload`;

/** 媒体块类型列表 */
export const MEDIA_BLOCK_TYPES = [
  'customImage',
  'customVideo',
  'customAudio',
  'customFile',
] as const;

/** 媒体块类型到中文名称的映射 */
export const MEDIA_TYPE_NAMES: Record<string, string> = {
  customImage: '图片',
  customVideo: '视频',
  customAudio: '音频',
  customFile: '文件',
};

/** 媒体类型映射（块类型 -> 媒体类型） */
export const MEDIA_TYPE_MAP: Record<
  string,
  'image' | 'video' | 'audio' | 'file'
> = {
  customImage: 'image',
  customVideo: 'video',
  customAudio: 'audio',
  customFile: 'file',
};

/** 视频扩展名 */
export const VIDEO_EXTENSIONS = [
  '.mp4',
  '.webm',
  '.mov',
  '.avi',
  '.mkv',
  '.m3u8',
];

/** 音频扩展名 */
export const AUDIO_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.ogg',
  '.aac',
  '.flac',
  '.m4a',
];

/** 分组顺序 */
export const SLASH_MENU_GROUP_ORDER = [
  '基础块',
  '标题',
  '列表',
  '媒体',
  '高级',
];

/** 分组名称映射（英文 -> 中文） */
export const SLASH_MENU_GROUP_MAPPING: Record<string, string> = {
  'basic blocks': '基础块',
  headings: '标题',
  lists: '列表',
  media: '媒体',
  advanced: '高级',
  other: '其他',
};

/** 需要排除的默认菜单项 */
export const EXCLUDED_SLASH_MENU_ITEMS = [
  'image',
  'video',
  'audio',
  'file',
  '图片',
  '视频',
  '音频',
  '文件',
  'toggle',
  'collapsible',
  '折叠',
  '可折叠',
  '折叠列表',
];
