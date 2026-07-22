import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  content: string;
  className?: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ content, className }) => {
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none break-words leading-6 dark:prose-p:text-stone-200 dark:prose-headings:text-stone-100 dark:prose-strong:text-amber-50 dark:prose-li:text-stone-200 dark:prose-blockquote:text-stone-400 dark:prose-blockquote:border-amber-100/20',
        // 首末元素外边距归零，避免气泡内顶/底部留白不均
        '[&>*:first-child]:!mt-0 [&>*:last-child]:!mb-0',
        // 段落与列表的上下间距统一
        'prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5',
        'prose-headings:mt-3 prose-headings:mb-2',
        // 代码块样式
        'prose-pre:bg-stone-900 dark:prose-pre:bg-[#0d0b0a] prose-pre:text-stone-100 prose-pre:border prose-pre:border-stone-800 dark:prose-pre:border-white/[0.08] prose-pre:rounded-xl prose-pre:p-3 prose-pre:text-xs prose-pre:my-2 prose-pre:shadow-inner',
        // 内联代码
        'prose-code:before:hidden prose-code:after:hidden prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:bg-black/5 dark:prose-code:bg-amber-100/[0.08] dark:prose-code:text-amber-100 prose-code:font-normal',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};
