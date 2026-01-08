'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Highlight, PrismTheme } from 'prism-react-renderer';
import { cn } from '@/lib/utils';

// 内联复制按钮组件
interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const CopyButton = ({ value, className, ...props }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // 兼容旧浏览器
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setCopied(false), 1200);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? '已复制' : '复制到剪贴板'}
      title={copied ? '已复制!' : '复制'}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'hover:bg-white/10',
        className
      )}
      {...props}
    >
      <span className="sr-only">{copied ? '已复制' : '复制'}</span>
      {copied ? (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
};

// 深色主题
const darkTheme: PrismTheme = {
  plain: { color: '#e4e4e7', backgroundColor: '#18181b' },
  styles: [
    { types: ['comment'], style: { color: '#6b7280', fontStyle: 'italic' } },
    {
      types: ['keyword', 'property', 'property-access', 'attr-name'],
      style: { color: '#7dd3fc' },
    },
    { types: ['tag'], style: { color: '#fbbf24' } },
    { types: ['punctuation', 'symbol', 'dom'], style: { color: '#e4e4e7' } },
    { types: ['definition', 'function'], style: { color: '#5eead4' } },
    { types: ['string', 'char', 'attr-value'], style: { color: '#c4b5fd' } },
    { types: ['static', 'number'], style: { color: '#f87171' } },
    { types: ['boolean'], style: { color: '#f87171' } },
    { types: ['operator'], style: { color: '#94a3b8' } },
    { types: ['class-name'], style: { color: '#fcd34d' } },
  ],
};

// 浅色主题
const lightTheme: PrismTheme = {
  plain: { color: '#1f2937', backgroundColor: '#f9fafb' },
  styles: [
    { types: ['comment'], style: { color: '#6b7280', fontStyle: 'italic' } },
    {
      types: ['keyword', 'property', 'property-access', 'attr-name'],
      style: { color: '#7c3aed' },
    },
    { types: ['tag'], style: { color: '#059669' } },
    { types: ['punctuation', 'symbol', 'dom'], style: { color: '#1f2937' } },
    { types: ['definition', 'function'], style: { color: '#2563eb' } },
    { types: ['string', 'char', 'attr-value'], style: { color: '#b45309' } },
    { types: ['static', 'number'], style: { color: '#dc2626' } },
    { types: ['boolean'], style: { color: '#dc2626' } },
    { types: ['operator'], style: { color: '#64748b' } },
    { types: ['class-name'], style: { color: '#0d9488' } },
  ],
};

export interface CodeSnippetProps {
  title?: string;
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({
  title,
  code,
  language = 'typescript',
  className,
  showLineNumbers = true,
  maxHeight = '400px',
}) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          checkDarkMode();
        }
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const selectedTheme = isDark ? darkTheme : lightTheme;
  const trimmedCode = code.trim();

  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden border border-border my-4',
        className
      )}
    >
      {/* 顶部栏：红绿灯 + 标题 + 复制按钮 */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-border"
        style={{
          backgroundColor: isDark ? '#27272a' : '#f4f4f5',
        }}
      >
        <div className="flex items-center gap-3">
          {/* 红绿灯 */}
          <div className="flex space-x-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          {/* 标题/语言 */}
          {title && (
            <span
              className="text-xs font-medium"
              style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
            >
              {title}
            </span>
          )}
        </div>
        {/* 复制按钮 */}
        <CopyButton
          value={trimmedCode}
          className={
            isDark
              ? 'text-zinc-400 hover:text-zinc-200'
              : 'text-zinc-600 hover:text-zinc-800'
          }
        />
      </div>

      {/* 代码区域 */}
      <div
        className="overflow-auto"
        style={{
          backgroundColor: selectedTheme.plain?.backgroundColor,
          maxHeight,
        }}
      >
        <Highlight theme={selectedTheme} code={trimmedCode} language={language}>
          {({
            className: preClassName,
            style,
            tokens,
            getLineProps,
            getTokenProps,
          }) => (
            <pre
              className={cn(preClassName, 'text-sm font-mono p-4 m-0')}
              style={{ ...style, backgroundColor: 'transparent' }}
            >
              {tokens.map((line, i) => (
                <div
                  key={i}
                  {...getLineProps({ line })}
                  className="flex hover:bg-white/5 transition-colors"
                >
                  {showLineNumbers && (
                    <span
                      className="select-none text-right pr-4 min-w-[2.5rem]"
                      style={{
                        color: isDark ? '#52525b' : '#a1a1aa',
                      }}
                    >
                      {i + 1}
                    </span>
                  )}
                  <span className="flex-1">
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
};

export default CodeSnippet;
