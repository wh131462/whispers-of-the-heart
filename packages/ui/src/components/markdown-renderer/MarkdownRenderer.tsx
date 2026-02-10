import React, {
  useMemo,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Marked, Tokens } from 'marked';
import { cn } from '@/lib/utils';
import {
  CodeRenderer,
  MindMapRendererWrapper,
  MathRenderer,
  FileRenderer,
} from './renderers';
import { VideoPlayer } from '../VideoPlayer';
import { AudioPlayer } from '../AudioPlayer';
import { createRoot, Root } from 'react-dom/client';
import { getMediaUrl } from '@whispers/utils';
import {
  FilePreviewModal,
  type PreviewFileLink,
} from '@eternalheart/react-file-preview';
import '@eternalheart/react-file-preview/style.css';

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

// 存储代码块内容的映射
interface CodeBlockData {
  id: string;
  code: string;
  language: string;
}

// 存储数学公式内容的映射
interface MathBlockData {
  id: string;
  formula: string;
  displayMode: boolean;
}

// 创建 marked 实例，配置自定义渲染器
const createMarkedInstance = (
  mindmapDataList: MindMapData[],
  codeBlockDataList: CodeBlockData[],
  mathBlockDataList: MathBlockData[]
) => {
  const instance = new Marked();

  // 配置选项
  instance.setOptions({
    breaks: true,
    gfm: true,
  });

  // 自定义代码块渲染器
  const renderer = {
    image(token: Tokens.Image): string {
      const src = token.href;
      const alt = token.text || '';
      const title = token.title || '';
      const caption = alt || title;
      if (caption) {
        return `<figure class="md-image-figure"><img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ''} /><figcaption class="md-image-caption">${caption}</figcaption></figure>`;
      }
      return `<img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ''} />`;
    },
    code(token: Tokens.Code): string {
      const { text, lang } = token;
      // 处理 markmap 代码块
      if (lang === 'markmap') {
        const id = `mindmap-${mindmapDataList.length}`;
        mindmapDataList.push({ id, content: text });
        // 返回占位符 div，稍后会被 React 组件替换
        return `<div data-mindmap-placeholder="${id}" class="mindmap-placeholder"></div>`;
      }
      // 其他代码块使用 CodeRenderer 组件
      const id = `codeblock-${codeBlockDataList.length}`;
      codeBlockDataList.push({ id, code: text, language: lang || '' });
      return `<div data-codeblock-placeholder="${id}" class="codeblock-placeholder"></div>`;
    },
  };

  instance.use({ renderer });

  // 添加数学公式扩展
  instance.use({
    extensions: [
      // 块级数学公式 $$...$$
      {
        name: 'mathBlock',
        level: 'block',
        start(src: string) {
          return src.match(/^\$\$/)?.index;
        },
        tokenizer(src: string) {
          const match = src.match(/^\$\$([\s\S]*?)\$\$/);
          if (match) {
            return {
              type: 'mathBlock',
              raw: match[0],
              text: match[1].trim(),
            };
          }
          return undefined;
        },
        renderer(token: Tokens.Generic) {
          const id = `math-block-${mathBlockDataList.length}`;
          mathBlockDataList.push({
            id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formula: (token as any).text || '',
            displayMode: true,
          });
          return `<div data-math-placeholder="${id}" class="math-placeholder"></div>`;
        },
      },
      // 行内数学公式 $...$
      {
        name: 'mathInline',
        level: 'inline',
        start(src: string) {
          return src.match(/\$(?!\$)/)?.index;
        },
        tokenizer(src: string) {
          const match = src.match(/^\$([^$\n]+?)\$/);
          if (match) {
            return {
              type: 'mathInline',
              raw: match[0],
              text: match[1].trim(),
            };
          }
          return undefined;
        },
        renderer(token: Tokens.Generic) {
          const id = `math-inline-${mathBlockDataList.length}`;
          mathBlockDataList.push({
            id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formula: (token as any).text || '',
            displayMode: false,
          });
          return `<span data-math-inline-placeholder="${id}" class="math-inline-placeholder"></span>`;
        },
      },
    ],
  });

  return instance;
};

// 根据 URL 获取文件类型
const getMimeType = (url: string): string => {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    bmp: 'image/bmp',
  };
  return mimeTypes[ext] || 'image/png';
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootsRef = useRef<Map<string, Root>>(new Map());
  const mediaRootsRef = useRef<Map<string, Root>>(new Map());
  const [mindmapData, setMindmapData] = useState<MindMapData[]>([]);
  const [codeBlockData, setCodeBlockData] = useState<CodeBlockData[]>([]);
  const [mathBlockData, setMathBlockData] = useState<MathBlockData[]>([]);

  // 图片预览状态
  const [previewFiles, setPreviewFiles] = useState<PreviewFileLink[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 收集内容中的所有图片
  const collectImages = useCallback((): PreviewFileLink[] => {
    const files: PreviewFileLink[] = [];
    if (!containerRef.current) return files;

    const images = containerRef.current.querySelectorAll('img');
    images.forEach((img, index) => {
      files.push({
        id: `img-${index}`,
        name: img.alt || `图片 ${index + 1}`,
        url: img.src,
        type: getMimeType(img.src),
      });
    });

    return files;
  }, []);

  // 处理图片点击
  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.tagName === 'IMG') {
        e.preventDefault();
        const img = target as HTMLImageElement;
        const files = collectImages();
        const clickedIndex = files.findIndex(f => f.url === img.src);
        setPreviewFiles(files);
        setPreviewIndex(clickedIndex >= 0 ? clickedIndex : 0);
        setIsPreviewOpen(true);
      }
    },
    [collectImages]
  );

  // Generate HTML from markdown content
  const htmlContent = useMemo(() => {
    if (!content || content.trim() === '') return '';

    try {
      // 收集思维导图、代码块和数学公式数据
      const mindmapList: MindMapData[] = [];
      const codeBlockList: CodeBlockData[] = [];
      const mathBlockList: MathBlockData[] = [];
      const markedInstance = createMarkedInstance(
        mindmapList,
        codeBlockList,
        mathBlockList
      );
      const html = markedInstance.parse(content) as string;

      // 更新数据（在下一个微任务中，避免在渲染期间 setState）
      Promise.resolve().then(() => {
        setMindmapData(mindmapList);
        setCodeBlockData(codeBlockList);
        setMathBlockData(mathBlockList);
      });

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
      root.render(
        <MindMapRendererWrapper markdown={mdContent} height="500px" />
      );
      rootsRef.current.set(id, root);
    });

    // 1.5 渲染代码块到占位符
    codeBlockData.forEach(({ id, code, language }) => {
      if (!isMounted || !containerRef.current) return;
      const placeholder = containerRef.current.querySelector(
        `[data-codeblock-placeholder="${id}"]`
      );
      if (!placeholder) return;

      const container = document.createElement('div');
      container.className = 'codeblock-container';
      placeholder.replaceWith(container);

      const root = createRoot(container);
      root.render(
        <CodeRenderer
          code={code}
          language={language || 'text'}
          showLineNumbers={true}
        />
      );
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
          <MindMapRendererWrapper markdown={markdownContent} height="500px" />
        );
        rootsRef.current.set(`mindmap-fallback-${index}`, root);
      });
    }

    // 3. 渲染数学公式到占位符
    mathBlockData.forEach(({ id, formula, displayMode }) => {
      if (!isMounted || !containerRef.current) return;

      // 查找块级数学公式占位符
      let placeholder = containerRef.current.querySelector(
        `[data-math-placeholder="${id}"]`
      );
      // 查找行内数学公式占位符
      if (!placeholder) {
        placeholder = containerRef.current.querySelector(
          `[data-math-inline-placeholder="${id}"]`
        );
      }
      if (!placeholder) return;

      const container = document.createElement(displayMode ? 'div' : 'span');
      container.className = displayMode
        ? 'math-container my-4'
        : 'math-inline-container';
      placeholder.replaceWith(container);

      const root = createRoot(container);
      root.render(<MathRenderer formula={formula} displayMode={displayMode} />);
      rootsRef.current.set(id, root);
    });

    return () => {
      isMounted = false;
      // 直接清理，不能延迟（否则会清理掉新创建的 roots）
      cleanupRoots();
    };
  }, [htmlContent, mindmapData, codeBlockData, mathBlockData]);

  // 单独处理视频和音频元素（只依赖 htmlContent，避免被其他状态变化触发重复清理）
  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    // 清理媒体相关的 React 根
    const cleanupMediaRoots = () => {
      mediaRootsRef.current.forEach(root => {
        try {
          root.unmount();
        } catch {
          // 忽略卸载错误
        }
      });
      mediaRootsRef.current.clear();
    };

    cleanupMediaRoots();

    if (!isMounted || !containerRef.current) return;

    // 解析 title|caption 格式的辅助函数
    const parseDisplayText = (
      text: string
    ): { title: string; caption: string } => {
      if (text.includes('|')) {
        const parts = text.split('|');
        return {
          title: parts[0].trim(),
          caption: parts.slice(1).join('|').trim(),
        };
      }
      return { title: text, caption: '' };
    };

    // 处理视频元素
    // 先处理 figure 包裹的视频
    const videoFigures =
      containerRef.current.querySelectorAll('figure:has(video)');
    videoFigures.forEach((figure, index) => {
      if (!isMounted) return;
      const videoEl = figure.querySelector('video');
      const figcaption = figure.querySelector('figcaption');
      if (!videoEl) return;

      const src = videoEl.getAttribute('src') || '';
      if (!src) return;

      // 解析 title|caption 格式
      const videoText = videoEl.textContent?.trim() || '';
      const { title: parsedTitle, caption: parsedCaption } =
        parseDisplayText(videoText);
      // 优先使用 figcaption，其次使用解析的 caption
      const title = parsedTitle;
      const caption = figcaption?.textContent?.trim() || parsedCaption;

      const container = document.createElement('div');
      container.className = 'video-container my-6';
      figure.replaceWith(container);

      const root = createRoot(container);
      root.render(
        <figure className="video-wrapper">
          <VideoPlayer src={getMediaUrl(src)} title={title || undefined} />
          {caption && (
            <figcaption
              style={{
                marginTop: '0.75rem',
                fontSize: '0.875rem',
                color: 'hsl(var(--muted-foreground))',
                textAlign: 'center',
              }}
            >
              {caption}
            </figcaption>
          )}
        </figure>
      );
      mediaRootsRef.current.set(`video-figure-${index}`, root);
    });

    // 再处理独立的 video 标签
    const standaloneVideos = containerRef.current.querySelectorAll('video');
    standaloneVideos.forEach((videoEl, index) => {
      if (!isMounted) return;

      const src = videoEl.getAttribute('src') || '';
      if (!src) return;

      // 解析 title|caption 格式
      const videoText = videoEl.textContent?.trim() || '';
      const { title, caption } = parseDisplayText(videoText);

      const container = document.createElement('div');
      container.className = 'video-container my-6';
      videoEl.replaceWith(container);

      const root = createRoot(container);
      root.render(
        <figure className="video-wrapper">
          <VideoPlayer src={getMediaUrl(src)} title={title || undefined} />
          {caption && (
            <figcaption
              style={{
                marginTop: '0.75rem',
                fontSize: '0.875rem',
                color: 'hsl(var(--muted-foreground))',
                textAlign: 'center',
              }}
            >
              {caption}
            </figcaption>
          )}
        </figure>
      );
      mediaRootsRef.current.set(`video-standalone-${index}`, root);
    });

    // 处理音频元素
    // 先处理 figure 包裹的音频
    const audioFigures =
      containerRef.current.querySelectorAll('figure:has(audio)');
    audioFigures.forEach((figure, index) => {
      if (!isMounted) return;
      const audioEl = figure.querySelector('audio');
      const figcaption = figure.querySelector('figcaption');
      if (!audioEl) return;

      const src = audioEl.getAttribute('src') || '';
      if (!src) return;

      // 解析 title|caption 格式
      const audioText = audioEl.textContent?.trim() || '';
      const { title: parsedTitle, caption: parsedCaption } =
        parseDisplayText(audioText);
      // 优先使用 figcaption，其次使用解析的 caption
      const title = parsedTitle || '未命名音频';
      const caption = figcaption?.textContent?.trim() || parsedCaption;

      const container = document.createElement('div');
      container.className = 'audio-container my-6';
      figure.replaceWith(container);

      const root = createRoot(container);
      root.render(
        <figure className="audio-wrapper">
          <AudioPlayer src={getMediaUrl(src)} title={title} />
          {caption && (
            <figcaption
              style={{
                marginTop: '0.75rem',
                fontSize: '0.875rem',
                color: 'hsl(var(--muted-foreground))',
                textAlign: 'center',
              }}
            >
              {caption}
            </figcaption>
          )}
        </figure>
      );
      mediaRootsRef.current.set(`audio-figure-${index}`, root);
    });

    // 再处理独立的 audio 标签
    const standaloneAudios = containerRef.current.querySelectorAll('audio');
    standaloneAudios.forEach((audioEl, index) => {
      if (!isMounted) return;

      const src = audioEl.getAttribute('src') || '';
      if (!src) return;

      // 解析 title|caption 格式
      const audioText = audioEl.textContent?.trim() || '';
      const { title, caption } = parseDisplayText(audioText);

      const container = document.createElement('div');
      container.className = 'audio-container my-6';
      audioEl.replaceWith(container);

      const root = createRoot(container);
      root.render(
        <figure className="audio-wrapper">
          <AudioPlayer src={getMediaUrl(src)} title={title || '未命名音频'} />
          {caption && (
            <figcaption
              style={{
                marginTop: '0.75rem',
                fontSize: '0.875rem',
                color: 'hsl(var(--muted-foreground))',
                textAlign: 'center',
              }}
            >
              {caption}
            </figcaption>
          )}
        </figure>
      );
      mediaRootsRef.current.set(`audio-standalone-${index}`, root);
    });

    // 处理文件块（新格式：figure[data-file-block]）
    const fileFiguresNew = containerRef.current.querySelectorAll(
      'figure[data-file-block]'
    );
    fileFiguresNew.forEach((figure, index) => {
      if (!isMounted) return;

      const linkEl = figure.querySelector('a');

      const href = linkEl?.getAttribute('href') || '';
      if (!href) return;

      // fileSize 从 figure 属性获取
      const fileSize = parseInt(
        figure.getAttribute('data-file-size') || '0',
        10
      );

      // 解析 文件名|说明 格式
      const textContent = linkEl?.textContent?.trim() || '';
      let title = '';
      let description = '';

      if (textContent.includes('|')) {
        const parts = textContent.split('|');
        title = parts[0].trim();
        description = parts.slice(1).join('|').trim();
      } else if (textContent) {
        title = textContent;
      }

      // 如果没有标题，从 URL 提取文件名
      if (!title) {
        try {
          const pathname = href.split('?')[0];
          const segments = pathname.split('/');
          title = decodeURIComponent(segments[segments.length - 1]) || '文件';
        } catch {
          title = '文件';
        }
      }

      const container = document.createElement('div');
      container.className = 'file-container my-4';
      figure.replaceWith(container);

      const root = createRoot(container);
      root.render(
        <FileRenderer
          src={getMediaUrl(href)}
          title={title}
          description={description}
          fileSize={fileSize}
        />
      );
      mediaRootsRef.current.set(`file-figure-new-${index}`, root);
    });

    // 处理文件链接（旧格式：a[data-file-block]，不在 figure 内）
    const fileLinks =
      containerRef.current.querySelectorAll('a[data-file-block]');
    fileLinks.forEach((linkEl, index) => {
      if (!isMounted) return;

      const href = linkEl.getAttribute('href') || '';
      if (!href) return;

      const fileSize = parseInt(
        linkEl.getAttribute('data-file-size') || '0',
        10
      );
      let title = linkEl.textContent?.trim() || '';
      if (!title) {
        try {
          const pathname = href.split('?')[0];
          const segments = pathname.split('/');
          title = decodeURIComponent(segments[segments.length - 1]) || '文件';
        } catch {
          title = '文件';
        }
      }

      const container = document.createElement('div');
      container.className = 'file-container my-4';
      linkEl.replaceWith(container);

      const root = createRoot(container);
      root.render(
        <FileRenderer
          src={getMediaUrl(href)}
          title={title}
          fileSize={fileSize}
        />
      );
      mediaRootsRef.current.set(`file-${index}`, root);
    });

    // 处理 figure 包裹的文件链接（旧格式：figure:has(a[data-file-block])）
    const fileFigures = containerRef.current.querySelectorAll(
      'figure:has(a[data-file-block])'
    );
    fileFigures.forEach((figure, index) => {
      if (!isMounted) return;
      // 跳过已处理的新格式 figure
      if (figure.hasAttribute('data-file-block')) return;

      const linkEl = figure.querySelector('a[data-file-block]');
      const caption = figure.querySelector('figcaption');
      if (!linkEl) return;

      const href = linkEl.getAttribute('href') || '';
      if (!href) return;

      const fileSize = parseInt(
        linkEl.getAttribute('data-file-size') || '0',
        10
      );
      let title =
        caption?.textContent?.trim() || linkEl.textContent?.trim() || '';
      if (!title) {
        try {
          const pathname = href.split('?')[0];
          const segments = pathname.split('/');
          title = decodeURIComponent(segments[segments.length - 1]) || '文件';
        } catch {
          title = '文件';
        }
      }

      const container = document.createElement('div');
      container.className = 'file-container my-4';
      figure.replaceWith(container);

      const root = createRoot(container);
      root.render(
        <FileRenderer
          src={getMediaUrl(href)}
          title={title}
          fileSize={fileSize}
        />
      );
      mediaRootsRef.current.set(`file-figure-${index}`, root);
    });

    return () => {
      isMounted = false;
      cleanupMediaRoots();
    };
  }, [htmlContent]);

  // 缓存 dangerouslySetInnerHTML 对象，避免父组件重新渲染时重置 DOM
  // 这样可以防止 React 认为 DOM 需要更新，从而保留用 replaceWith 替换的思维导图容器
  const dangerousHtml = useMemo(() => ({ __html: htmlContent }), [htmlContent]);

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          'markdown-content',
          '[&_img]:cursor-pointer [&_img]:transition-opacity [&_img:hover]:opacity-90',
          className
        )}
        onClick={handleContentClick}
        dangerouslySetInnerHTML={dangerousHtml}
      />

      {/* 图片预览 */}
      <FilePreviewModal
        files={previewFiles}
        currentIndex={previewIndex}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onNavigate={setPreviewIndex}
      />
    </>
  );
};

export default MarkdownRenderer;
