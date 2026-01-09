/**
 * MathRenderer - 数学公式渲染组件
 * 用于在 MarkdownRenderer 中渲染 LaTeX 数学公式
 */
import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.css';

export interface MathRendererProps {
  /** LaTeX 公式内容 */
  formula: string;
  /** 是否为块级公式（displayMode） */
  displayMode?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 数学公式渲染组件
 * 使用 KaTeX 渲染 LaTeX 公式
 */
/**
 * 清理公式内容，去除开头和结尾多余的反斜杠和换行符
 * 处理用户在 $$ 后使用 \ 换行的情况
 */
const cleanFormula = (formula: string): string => {
  return formula
    .replace(/^\\+\s*\n?/, '') // 去除开头的反斜杠和换行
    .replace(/\\+\s*$/, '') // 去除结尾的反斜杠
    .trim();
};

export const MathRenderer: React.FC<MathRendererProps> = ({
  formula,
  displayMode = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanedFormula = cleanFormula(formula);

  useEffect(() => {
    if (!containerRef.current || !cleanedFormula) return;

    try {
      containerRef.current.innerHTML = '';
      katex.render(cleanedFormula, containerRef.current, {
        throwOnError: false,
        displayMode,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('KaTeX 渲染失败:', error);
      containerRef.current.innerHTML = `<span class="text-red-500 text-sm">公式渲染错误</span>`;
    }
  }, [cleanedFormula, displayMode]);

  if (!cleanedFormula) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`math-renderer ${displayMode ? 'math-block' : 'math-inline'} ${className}`}
      style={{
        textAlign: displayMode ? 'center' : 'inherit',
        padding: displayMode ? '1rem 0' : '0',
        overflowX: 'auto',
      }}
    />
  );
};

export default MathRenderer;
