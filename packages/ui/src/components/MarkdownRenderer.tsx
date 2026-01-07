import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Marked, Tokens } from 'marked';
import { cn } from '@/lib/utils';
import MindMapRenderer from './MindMapRenderer';
import VideoPlayer from './VideoPlayer';
import AudioPlayer from './AudioPlayer';
import { createRoot, Root } from 'react-dom/client';
import { getMediaUrl } from '@whispers/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * MarkdownRenderer 组件
 *
 * 使用说明：
 * - 该组件已内置完整的 Markdown 样式，无需额外的 prose 类名
 * - 如需自定义样式，请通过 className 添加额外类名
 * - 避免同时使用 Tailwind 的 prose 类名，可能会产生样式冲突
 * - 支持思维导图渲染（使用```markmap代码块）
 *
 * 示例：
 * <MarkdownRenderer content={markdownText} className="max-w-none" />
 */

// 存储思维导图内容的映射
interface MindMapData {
  id: string;
  content: string;
}

// 创建 marked 实例，配置自定义渲染器
const createMarkedInstance = (mindmapDataList: MindMapData[]) => {
  const instance = new Marked();

  // 配置选项
  instance.setOptions({
    breaks: true,
    gfm: true,
  });

  // 自定义代码块渲染器
  const renderer = {
    code(token: Tokens.Code): string {
      const { text, lang } = token;
      // 处理 markmap 代码块
      if (lang === 'markmap') {
        const id = `mindmap-${mindmapDataList.length}`;
        mindmapDataList.push({ id, content: text });
        // 返回占位符 div，稍后会被 React 组件替换
        return `<div data-mindmap-placeholder="${id}" class="mindmap-placeholder"></div>`;
      }
      // 其他代码块使用默认渲染
      const langClass = lang ? ` class="language-${lang}"` : '';
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      return `<pre><code${langClass}>${escaped}</code></pre>`;
    },
  };

  instance.use({ renderer });
  return instance;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootsRef = useRef<Map<string, Root>>(new Map());
  const [mindmapData, setMindmapData] = useState<MindMapData[]>([]);

  // Generate HTML from markdown content
  const htmlContent = useMemo(() => {
    if (!content || content.trim() === '') return '';

    try {
      // 收集思维导图数据
      const dataList: MindMapData[] = [];
      const markedInstance = createMarkedInstance(dataList);
      const html = markedInstance.parse(content) as string;

      // 更新思维导图数据（在下一个微任务中，避免在渲染期间 setState）
      Promise.resolve().then(() => setMindmapData(dataList));

      return html;
    } catch {
      return `<pre>${content}</pre>`;
    }
  }, [content]);

  // 处理自定义块的渲染 (思维导图、视频、音频等)
  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    // 安全地清理旧的 React 根
    const cleanupRoots = () => {
      rootsRef.current.forEach(root => {
        try {
          root.unmount();
        } catch {
          // 忽略卸载错误
        }
      });
      rootsRef.current.clear();
    };

    // 清理旧的React根
    cleanupRoots();

    // 如果组件已卸载，不再继续
    if (!isMounted || !containerRef.current) return;

    // 1. 渲染思维导图到占位符
    mindmapData.forEach(({ id, content: mdContent }) => {
      if (!isMounted || !containerRef.current) return;
      const placeholder = containerRef.current.querySelector(
        `[data-mindmap-placeholder="${id}"]`
      );
      if (!placeholder) return;

      const container = document.createElement('div');
      container.className = 'mindmap-container my-6';
      placeholder.replaceWith(container);

      const root = createRoot(container);
      root.render(<MindMapRenderer markdown={mdContent} height="500px" />);
      rootsRef.current.set(id, root);
    });

    // 2. 兼容：查找可能遗漏的 markmap 代码块（从其他来源的 HTML）
    if (isMounted && containerRef.current) {
      const remainingBlocks = containerRef.current.querySelectorAll(
        'pre code.language-markmap, pre[data-mindmap] code'
      );
      remainingBlocks.forEach((codeEl, index) => {
        if (!isMounted) return;
        const preEl = codeEl.parentElement;
        if (!preEl) return;

        const markdownContent = codeEl.textContent || '';
        const container = document.createElement('div');
        container.className = 'mindmap-container my-6';
        preEl.replaceWith(container);

        const root = createRoot(container);
        root.render(
          <MindMapRenderer markdown={markdownContent} height="500px" />
        );
        rootsRef.current.set(`mindmap-fallback-${index}`, root);
      });
    }

    // 3. 查找所有自定义视频块
    if (isMounted && containerRef.current) {
      const videoFigures =
        containerRef.current.querySelectorAll('figure:has(video)');
      videoFigures.forEach((figure, index) => {
        if (!isMounted) return;
        const videoEl = figure.querySelector('video');
        const caption = figure.querySelector('figcaption');
        if (!videoEl) return;

        const src = videoEl.getAttribute('src') || '';
        const title = caption?.textContent || '';

        const container = document.createElement('div');
        container.className = 'video-container my-6';
        figure.replaceWith(container);

        const root = createRoot(container);
        root.render(<VideoPlayer src={getMediaUrl(src)} title={title} />);
        rootsRef.current.set(`video-${index}`, root);
      });
    }

    // 4. 查找所有自定义音频块
    if (isMounted && containerRef.current) {
      const audioFigures =
        containerRef.current.querySelectorAll('figure:has(audio)');
      audioFigures.forEach((figure, index) => {
        if (!isMounted) return;
        const audioEl = figure.querySelector('audio');
        const caption = figure.querySelector('figcaption');
        if (!audioEl) return;

        const src = audioEl.getAttribute('src') || '';
        const captionText = caption?.textContent || '';
        // 解析 title - artist 格式
        const parts = captionText.split(' - ');
        const title = parts[0]?.trim() || '未命名音频';
        const artist = parts[1]?.trim();

        const container = document.createElement('div');
        container.className = 'audio-container my-6';
        figure.replaceWith(container);

        const root = createRoot(container);
        root.render(
          <AudioPlayer src={getMediaUrl(src)} title={title} artist={artist} />
        );
        rootsRef.current.set(`audio-${index}`, root);
      });
    }

    return () => {
      isMounted = false;
      // 直接清理，不能延迟（否则会清理掉新创建的 roots）
      cleanupRoots();
    };
  }, [htmlContent, mindmapData]);

  // 缓存 dangerouslySetInnerHTML 对象，避免父组件重新渲染时重置 DOM
  // 这样可以防止 React 认为 DOM 需要更新，从而保留用 replaceWith 替换的思维导图容器
  const dangerousHtml = useMemo(() => ({ __html: htmlContent }), [htmlContent]);

  return (
    <div
      ref={containerRef}
      className={cn('markdown-content', className)}
      dangerouslySetInnerHTML={dangerousHtml}
    />
  );
};

export default MarkdownRenderer;
