'use client';

import React, { useEffect, useRef, useState } from 'react';
import { codeToHtml } from 'shiki';
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

// Shiki 支持的语言映射
const languageMap: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  jsx: 'jsx',
  tsx: 'tsx',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  golang: 'go',
  'c++': 'cpp',
  yml: 'yaml',
  md: 'markdown',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
};

const normalizeLanguage = (lang: string): string => {
  const normalized = lang.toLowerCase().trim();
  return languageMap[normalized] || normalized;
};

export interface CodeRendererProps {
  title?: string;
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
}

export const CodeRenderer: React.FC<CodeRendererProps> = ({
  title,
  code,
  language = 'typescript',
  className,
  showLineNumbers = true,
  maxHeight = '400px',
}) => {
  const [isDark, setIsDark] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

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

  const trimmedCode = code.trim();
  const normalizedLang = normalizeLanguage(language);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const highlight = async () => {
      try {
        const html = await codeToHtml(trimmedCode, {
          lang: normalizedLang,
          theme: isDark ? 'github-dark' : 'github-light',
        });
        if (!cancelled) {
          setHighlightedHtml(html);
          setIsLoading(false);
        }
      } catch {
        try {
          const html = await codeToHtml(trimmedCode, {
            lang: 'plaintext',
            theme: isDark ? 'github-dark' : 'github-light',
          });
          if (!cancelled) {
            setHighlightedHtml(html);
            setIsLoading(false);
          }
        } catch {
          if (!cancelled) {
            setHighlightedHtml(
              `<pre><code>${trimmedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
            );
            setIsLoading(false);
          }
        }
      }
    };

    highlight();
    return () => {
      cancelled = true;
    };
  }, [trimmedCode, normalizedLang, isDark]);

  const lines = trimmedCode.split('\n');
  const lineCount = lines.length;

  return (
    <div className={cn('code-renderer-wrapper', className)}>
      {/* 顶部栏 */}
      <div className="code-renderer-header">
        <div className="code-renderer-header-left">
          <div className="code-renderer-traffic-lights">
            <span className="light red" />
            <span className="light yellow" />
            <span className="light green" />
          </div>
          {(title || language) && (
            <span className="code-renderer-lang">{title || language}</span>
          )}
        </div>
        <CopyButton value={trimmedCode} className="code-renderer-copy-btn" />
      </div>

      {/* 代码区域 */}
      <div className="code-renderer-content" style={{ maxHeight }}>
        <div className="code-renderer-inner">
          {showLineNumbers && (
            <div className="code-renderer-line-numbers">
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1} className="line-number">
                  {i + 1}
                </div>
              ))}
            </div>
          )}
          <div
            className={cn(
              'code-renderer-code',
              isLoading && 'code-renderer-loading'
            )}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </div>
      </div>

      <style>{`
        .code-renderer-wrapper {
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid hsl(var(--border));
          margin: 1.5rem 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .code-renderer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.625rem 1rem;
          background: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
        }

        .code-renderer-header-left {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .code-renderer-traffic-lights {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .code-renderer-traffic-lights .light {
          width: 0.625rem;
          height: 0.625rem;
          border-radius: 50%;
        }

        .code-renderer-traffic-lights .light.red {
          background-color: #ff5f56;
        }

        .code-renderer-traffic-lights .light.yellow {
          background-color: #ffbd2e;
        }

        .code-renderer-traffic-lights .light.green {
          background-color: #27c93f;
        }

        .code-renderer-lang {
          font-size: 0.75rem;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
          text-transform: lowercase;
          letter-spacing: 0.02em;
          font-family: "JetBrains Mono", "Fira Code", "SF Mono", ui-monospace, monospace;
        }

        .code-renderer-copy-btn {
          color: hsl(var(--muted-foreground));
          transition: color 0.15s ease;
        }

        .code-renderer-copy-btn:hover {
          color: hsl(var(--foreground));
        }

        .code-renderer-content {
          overflow: auto;
          background: hsl(var(--background));
        }

        .code-renderer-inner {
          display: flex;
          align-items: stretch;
        }

        .code-renderer-line-numbers {
          flex-shrink: 0;
          padding: 16px 0;
          text-align: right;
          user-select: none;
          background: hsl(var(--muted) / 0.5);
          border-right: 1px solid hsl(var(--border) / 0.5);
        }

        .code-renderer-line-numbers .line-number {
          display: block;
          padding: 0 12px;
          font-size: 14px;
          line-height: 24px;
          color: hsl(var(--muted-foreground));
          font-family: "JetBrains Mono", "Fira Code", "SF Mono", ui-monospace, monospace;
        }

        .code-renderer-code {
          flex: 1;
          min-width: 0;
          overflow-x: auto;
        }

        .code-renderer-code.code-renderer-loading {
          opacity: 0.5;
        }

        /* 重置 pre/code 默认样式 */
        .code-renderer-code pre,
        .code-renderer-code code {
          margin: 0;
          padding: 0;
          border: 0;
          background: transparent;
        }

        .code-renderer-code pre.shiki {
          margin: 0 !important;
          padding: 16px !important;
          background: transparent !important;
          line-height: 24px;
        }

        .code-renderer-code pre.shiki code {
          font-size: 14px;
          line-height: 24px;
          font-family: "JetBrains Mono", "Fira Code", "SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
          background: transparent !important;
        }

        .code-renderer-code pre.shiki code .line {
          line-height: 24px;
        }

        .dark .code-renderer-header {
          background: hsl(24 15% 12%);
        }

        .dark .code-renderer-content {
          background: hsl(24 10% 10%);
        }

        .dark .code-renderer-line-numbers {
          background: hsl(24 15% 8%);
        }
      `}</style>
    </div>
  );
};

export default CodeRenderer;
