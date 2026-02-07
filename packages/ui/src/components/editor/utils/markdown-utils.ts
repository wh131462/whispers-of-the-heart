/**
 * Markdown 处理工具函数
 * 用于修复 BlockNote 输出的 Markdown 问题
 */

/**
 * 修复表格 markdown 输出：移除空表头行
 */
export const fixTableMarkdown = (markdown: string): string => {
  const tableRegex = /(\|[^\n]*\|)\n(\|[\s\-:]+\|)\n((?:\|[^\n]*\|\n?)+)/g;

  return markdown.replace(
    tableRegex,
    (match, headerRow, separatorRow, dataRows) => {
      const headerCells = headerRow.split('|').slice(1, -1);
      const isEmptyHeader = headerCells.every(
        (cell: string) => cell.trim() === ''
      );

      if (isEmptyHeader) {
        const dataLines = dataRows.trim().split('\n');
        if (dataLines.length > 0) {
          const newHeader = dataLines[0];
          const remainingData = dataLines.slice(1).join('\n');
          if (remainingData) {
            return `${newHeader}\n${separatorRow}\n${remainingData}\n`;
          } else {
            return `${newHeader}\n${separatorRow}\n`;
          }
        }
      }

      return match;
    }
  );
};

/**
 * 预处理 markdown：将 ```markmap 代码块转换为可识别的 HTML 格式
 */
export const preprocessMarkdownForMindMap = (markdown: string): string => {
  const markmapRegex = /```markmap\n([\s\S]*?)```/g;

  return markdown.replace(markmapRegex, (_match, content) => {
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre data-mindmap="true"><code class="language-markmap">${escapedContent}</code></pre>`;
  });
};
