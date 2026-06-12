/**
 * 将 Markdown 文本转换为纯文本（去掉所有格式标记、HTML、代码块等）。
 * 移植自 packages/utils/src/string.ts:stripMarkdown，纯函数无浏览器依赖。
 */
export function stripMarkdown(markdown: string): string {
  if (!markdown) return '';

  let text = markdown;

  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/<[^>]*>/g, '');
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1');
  text = text.replace(/^\[[^\]]+\]:\s*.+$/gm, '');
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/~~([^~]+)~~/g, '$1');
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');
  text = text.replace(/^>\s?/gm, '');
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');
  text = text.replace(/\[[ xX]\]\s*/g, '');
  text = text.replace(/\|/g, ' ');
  text = text.replace(/^[\s]*[-:]+[\s]*$/gm, '');
  text = text.replace(/\[\^[^\]]+\]/g, '');
  text = text.replace(/==([^=]+)==/g, '$1');
  text = text.replace(/\^([^^]+)\^/g, '$1');
  text = text.replace(/~([^~]+)~/g, '$1');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');

  return text.trim();
}
