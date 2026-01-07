import React, { useRef, useEffect, useState, useCallback } from 'react';
import MindElixir from 'mind-elixir';
import type { MindElixirInstance } from 'mind-elixir';
import 'mind-elixir/style';
import { cn } from '@/lib/utils';
import { Crosshair, ZoomIn, ZoomOut } from 'lucide-react';

// ============ Markdown → JSON 转换 ============

interface MindMapNode {
  id: string;
  topic: string;
  children?: MindMapNode[];
  root?: boolean;
}

// Arrow 类型 (MindElixir 连线)
interface ArrowStyle {
  stroke?: string;
  strokeWidth?: string | number;
  strokeDasharray?: string;
  strokeLinecap?: 'butt' | 'round' | 'square';
  opacity?: string | number;
  labelColor?: string;
}

interface Arrow {
  id: string;
  label: string;
  from: string;
  to: string;
  delta1: { x: number; y: number };
  delta2: { x: number; y: number };
  bidirectional?: boolean;
  style?: ArrowStyle;
}

// Summary 类型 (MindElixir 概要)
interface SummaryStyle {
  stroke?: string;
  labelColor?: string;
}

interface Summary {
  id: string;
  label: string;
  parent: string;
  start: number;
  end: number;
  style?: SummaryStyle;
}

interface MindMapMeta {
  direction?: number; // 0=SIDE, 1=LEFT, 2=RIGHT
  arrows?: Arrow[];
  summaries?: Summary[];
  nodeIds?: Record<string, string>; // 路径 -> ID 映射
}

interface MindMapData {
  nodeData: MindMapNode;
  arrows?: Arrow[];
  summaries?: Summary[];
  direction?: number;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

// 根据路径恢复节点ID
const restoreNodeIds = (
  node: MindMapNode,
  nodeIds: Record<string, string>,
  path: string = '0'
): void => {
  if (nodeIds[path]) {
    node.id = nodeIds[path];
  }
  if (node.children) {
    node.children.forEach((child, index) => {
      restoreNodeIds(child, nodeIds, `${path}.${index}`);
    });
  }
};

// 解析 meta 注释 (JSON 格式)
const parseMeta = (
  markdown: string
): { meta: MindMapMeta; content: string } => {
  const metaRegex = /^<!--\s*mindmap-meta\s*\n([\s\S]*?)\n-->\s*\n?/;
  const match = markdown.match(metaRegex);

  if (!match) {
    return { meta: {}, content: markdown };
  }

  const metaContent = match[1].trim();
  const content = markdown.slice(match[0].length);

  try {
    // 尝试解析 JSON 格式
    const meta = JSON.parse(metaContent) as MindMapMeta;
    return { meta, content };
  } catch {
    // 兼容旧格式: key: value
    const meta: MindMapMeta = {};
    metaContent.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        if (key === 'direction') {
          // 兼容旧的字符串格式
          if (value === 'LEFT') meta.direction = 1;
          else if (value === 'RIGHT') meta.direction = 2;
          else if (value === 'SIDE') meta.direction = 0;
          else meta.direction = parseInt(value, 10);
        }
      }
    });
    return { meta, content };
  }
};

const markdownToMindElixir = (markdown: string): MindMapData => {
  const { meta, content } = parseMeta(markdown);

  const lines = content.split('\n').filter(line => line.trim());

  const emptyData: MindMapData = {
    nodeData: {
      id: 'root',
      topic: '思维导图',
      root: true,
      children: [],
    },
    direction: meta.direction,
    arrows: meta.arrows,
    summaries: meta.summaries,
  };

  if (lines.length === 0) {
    return emptyData;
  }

  const parsedLines = lines
    .map(line => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        return {
          level: match[1].length,
          text: match[2].trim(),
        };
      }
      const listMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
      if (listMatch) {
        const indent = listMatch[1].length;
        return {
          level: Math.floor(indent / 2) + 2,
          text: listMatch[2].trim(),
        };
      }
      return null;
    })
    .filter(Boolean) as { level: number; text: string }[];

  if (parsedLines.length === 0) {
    return emptyData;
  }

  const root: MindMapNode = {
    id: 'root',
    topic: parsedLines[0].text,
    root: true,
    children: [],
  };

  const stack: { node: MindMapNode; level: number }[] = [
    { node: root, level: parsedLines[0].level },
  ];

  for (let i = 1; i < parsedLines.length; i++) {
    const { level, text } = parsedLines[i];
    const newNode: MindMapNode = {
      id: generateId(),
      topic: text,
      children: [],
    };

    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].node;
    if (!parent.children) parent.children = [];
    parent.children.push(newNode);

    stack.push({ node: newNode, level });
  }

  // 如果有保存的节点ID映射，恢复原始ID
  if (meta.nodeIds && Object.keys(meta.nodeIds).length > 0) {
    restoreNodeIds(root, meta.nodeIds);
  }

  return {
    nodeData: root,
    direction: meta.direction,
    arrows: meta.arrows,
    summaries: meta.summaries,
  };
};

// ============ 组件 ============

export interface MindMapRendererProps {
  markdown: string;
  className?: string;
  height?: string;
}

export const MindMapRenderer: React.FC<MindMapRendererProps> = ({
  markdown,
  className,
  height = '500px',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindElixirRef = useRef<MindElixirInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  // 获取 MindElixir direction 常量
  // MindElixir: LEFT=0, RIGHT=1, SIDE=2
  const getDirection = (dir?: number): 0 | 1 | 2 => {
    if (dir === 0 || dir === 1 || dir === 2) return dir;
    return MindElixir.SIDE; // 默认 SIDE (2)
  };

  // 控制按钮处理函数
  const handleZoomIn = useCallback(() => {
    if (mindElixirRef.current) {
      const newScale = Math.min(scale + 0.2, 2);
      mindElixirRef.current.scale(newScale);
      setScale(newScale);
    }
  }, [scale]);

  const handleZoomOut = useCallback(() => {
    if (mindElixirRef.current) {
      const newScale = Math.max(scale - 0.2, 0.4);
      mindElixirRef.current.scale(newScale);
      setScale(newScale);
    }
  }, [scale]);

  const handleCenter = useCallback(() => {
    if (mindElixirRef.current) {
      mindElixirRef.current.toCenter();
    }
  }, []);

  const handleResetScale = useCallback(() => {
    if (mindElixirRef.current) {
      mindElixirRef.current.scale(1);
      setScale(1);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || !markdown.trim()) return;

    let resizeObserver: ResizeObserver | null = null;
    let isMounted = true;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    let animationFrameId: number | null = null;

    try {
      setError(null);
      const data = markdownToMindElixir(markdown);

      // 清理旧实例
      if (mindElixirRef.current) {
        try {
          // 尝试调用 destroy 方法（如果存在）
          if (
            typeof (
              mindElixirRef.current as unknown as { destroy?: () => void }
            ).destroy === 'function'
          ) {
            (
              mindElixirRef.current as unknown as { destroy: () => void }
            ).destroy();
          }
        } catch {
          // 忽略销毁错误
        }
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        mindElixirRef.current = null;
      }

      const options = {
        el: containerRef.current,
        direction: getDirection(data.direction),
        draggable: true, // 允许拖拽移动视图
        contextMenu: false,
        toolBar: false,
        nodeMenu: false,
        keypress: false,
        allowUndo: false,
        locale: 'zh_CN' as const,
        editable: false,
        mouseSelectionButton: 2 as const, // 右键选择/拖拽
        // 禁用滚轮缩放，让滚轮事件自然冒泡实现页面滚动
        handleWheel: () => {},
      };

      const mind = new MindElixir(options);

      // 直接使用保存的 arrows 数据（包含原始 delta 值）
      const mindElixirData = {
        nodeData: data.nodeData,
        direction: getDirection(data.direction),
        arrows: data.arrows,
        summaries: data.summaries,
      };
      mind.init(mindElixirData);
      mindElixirRef.current = mind;

      // 初始化后多次刷新，确保 arrows 正确绘制（与 MindMapBlock 保持一致）
      const refreshAndCenter = () => {
        // 检查组件是否仍然挂载
        if (!isMounted || !mindElixirRef.current) return;
        try {
          mindElixirRef.current.refresh(mindElixirData);
          mindElixirRef.current.toCenter();
        } catch {
          // 忽略刷新错误
        }
      };

      // 使用多次延迟确保连线正确绘制，并保存 timeout ID 以便清理
      animationFrameId = requestAnimationFrame(refreshAndCenter);
      timeoutIds.push(setTimeout(refreshAndCenter, 50));
      timeoutIds.push(setTimeout(refreshAndCenter, 150));

      // 监听容器尺寸变化
      resizeObserver = new ResizeObserver(() => {
        if (isMounted && mindElixirRef.current) {
          try {
            mindElixirRef.current.toCenter();
          } catch (_e) {
            // 忽略错误
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : '思维导图渲染失败');
    }

    return () => {
      isMounted = false;

      // 清理所有定时器
      timeoutIds.forEach(id => clearTimeout(id));
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      resizeObserver?.disconnect();

      // 清理 MindElixir 实例
      if (mindElixirRef.current) {
        try {
          // 尝试调用 destroy 方法（如果存在）
          if (
            typeof (
              mindElixirRef.current as unknown as { destroy?: () => void }
            ).destroy === 'function'
          ) {
            (
              mindElixirRef.current as unknown as { destroy: () => void }
            ).destroy();
          }
        } catch {
          // 忽略销毁错误
        }
        mindElixirRef.current = null;
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [markdown]);

  if (!markdown || !markdown.trim()) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted rounded-lg p-8',
          className
        )}
      >
        <div className="text-center text-muted-foreground">
          <svg
            className="w-16 h-16 mx-auto mb-3 opacity-50"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <p>思维导图内容为空</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-muted rounded-lg p-8',
          className
        )}
        style={{ height }}
      >
        <svg
          className="w-12 h-12 text-destructive mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-lg font-semibold text-destructive mb-1">渲染失败</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mindmap-renderer relative bg-background border border-border rounded-lg overflow-hidden',
        className
      )}
      style={{ height }}
    >
      <div ref={containerRef} className="w-full h-full" />

      {/* 控制按钮 - 右下角水平布局 */}
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background/95 shadow-sm backdrop-blur-sm"
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={handleZoomOut}
          className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          title="缩小"
        >
          <ZoomOut size={14} />
        </button>
        <button
          type="button"
          onClick={handleResetScale}
          className="w-8 text-center text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded py-1 transition-colors"
          title="重置为100%"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          title="放大"
        >
          <ZoomIn size={14} />
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button
          type="button"
          onClick={handleCenter}
          className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          title="居中"
        >
          <Crosshair size={14} />
        </button>
      </div>
    </div>
  );
};

export default MindMapRenderer;
