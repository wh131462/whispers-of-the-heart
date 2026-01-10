/**
 * 编辑器共享类型定义
 */

/** 媒体选择器请求 */
export interface MediaPickerRequest {
  type: 'image' | 'video' | 'audio' | 'file';
  blockId: string;
}

/** 媒体块信息 */
export interface MediaBlockInfo {
  type: 'customImage' | 'customVideo' | 'customAudio' | 'customFile';
  url: string;
  /** 原始文件名（仅 customFile 使用） */
  fileName?: string;
  /** 媒体标题/名称（音视频使用） */
  title?: string;
  caption: string;
  width?: number;
  align?: string;
  fileSize?: number;
}

/** 代码块信息 */
export interface CodeBlockInfo {
  language: string;
  code: string;
}

/** 思维导图块信息 */
export interface MindMapBlockInfo {
  markdown: string;
}
