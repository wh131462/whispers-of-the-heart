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
        'prose prose-sm dark:prose-invert max-w-none break-words leading-6',
        // 首末元素外边距归零，避免气泡内顶/底部留白不均
        '[&>*:first-child]:!mt-0 [&>*:last-child]:!mb-0',
        // 段落与列表的上下间距统一
        'prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5',
        'prose-headings:mt-3 prose-headings:mb-2',
        // 代码块样式
        'prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-md prose-pre:p-3 prose-pre:text-xs prose-pre:my-2',
        // 内联代码
        'prose-code:before:hidden prose-code:after:hidden prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:bg-black/5 dark:prose-code:bg-white/10 prose-code:font-normal',
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
