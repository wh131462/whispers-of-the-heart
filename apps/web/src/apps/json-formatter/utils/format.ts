import type { IndentSize } from '../types';

/**
 * 格式化JSON字符串
 */
export function formatJson(input: string, indentSize: IndentSize = 2): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, indentSize);
}

/**
 * 带语法高亮的格式化（返回HTML）
 */
export function formatWithHighlight(
  input: string,
  indentSize: IndentSize = 2
): string {
  try {
    const parsed = JSON.parse(input);
    return syntaxHighlight(JSON.stringify(parsed, null, indentSize));
  } catch {
    return escapeHtml(input);
  }
}

/**
 * 语法高亮
 */
function syntaxHighlight(json: string): string {
  // 转义HTML特殊字符
  let escaped = escapeHtml(json);

  // 正则匹配并添加样式类
  escaped = escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    match => {
      let cls = 'json-number'; // 数字
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key'; // 键
        } else {
          cls = 'json-string'; // 字符串值
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean'; // 布尔
      } else if (/null/.test(match)) {
        cls = 'json-null'; // null
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );

  return escaped;
}

/**
 * 转义HTML特殊字符
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
