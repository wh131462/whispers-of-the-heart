import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
} from '@blocknote/react';
import MindElixir from 'mind-elixir';
import type { MindElixirInstance } from 'mind-elixir';
import 'mind-elixir/style';
import { Maximize2, Minimize2, Code, Eye, AlertCircle } from 'lucide-react';

// ============ Markdown ↔ JSON 转换工具 ============

interface MindMapNode {
  id: string;
  topic: string;
  children?: MindMapNode[];
  root?: boolean;
  style?: Record<string, unknown>;
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
  nodeIds?: Record<string, string>; // 路径 -> ID 映射，如 "0" -> "root", "0.0" -> "abc123"
}

interface MindMapData {
  nodeData: MindMapNode;
  arrows?: Arrow[];
  summaries?: Summary[];
  direction?: number;
}

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 10);

// 从节点树收集ID映射（路径 -> ID）
const collectNodeIds = (
  node: MindMapNode,
  path: string = '0'
): Record<string, string> => {
  const ids: Record<string, string> = { [path]: node.id };
  if (node.children) {
    node.children.forEach((child, index) => {
      const childPath = `${path}.${index}`;
      Object.assign(ids, collectNodeIds(child, childPath));
    });
  }
  return ids;
};

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
  // 匹配 JSON 格式的 meta 注释
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
          else meta.direction = parseInt(value, 10) as 0 | 1 | 2;
        }
      }
    });
    return { meta, content };
  }
};

// 生成 meta 注释 (JSON 格式)
const generateMetaComment = (meta: MindMapMeta): string => {
  // 过滤空值
  const filteredMeta: MindMapMeta = {};
  if (meta.direction !== undefined) filteredMeta.direction = meta.direction;
  if (meta.arrows && meta.arrows.length > 0) filteredMeta.arrows = meta.arrows;
  if (meta.summaries && meta.summaries.length > 0)
    filteredMeta.summaries = meta.summaries;
  if (meta.nodeIds && Object.keys(meta.nodeIds).length > 0)
    filteredMeta.nodeIds = meta.nodeIds;

  if (Object.keys(filteredMeta).length === 0) return '';

  // 使用 JSON 格式保存，确保复杂数据能正确序列化
  const jsonStr = JSON.stringify(filteredMeta, null, 2);
  return `<!-- mindmap-meta\n${jsonStr}\n-->\n`;
};

// Markdown → MindElixir JSON
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

  // 解析每行的层级和内容
  const parsedLines = lines
    .map(line => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        return {
          level: match[1].length,
          text: match[2].trim(),
        };
      }
      // 非标题行作为列表项处理
      const listMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
      if (listMatch) {
        const indent = listMatch[1].length;
        return {
          level: Math.floor(indent / 2) + 2, // 列表项从 level 2 开始
          text: listMatch[2].trim(),
        };
      }
      return null;
    })
    .filter(Boolean) as { level: number; text: string }[];

  if (parsedLines.length === 0) {
    return emptyData;
  }

  // 构建树形结构
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

    // 找到合适的父节点
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

// MindElixir JSON → Markdown
const mindElixirToMarkdown = (data: MindMapData): string => {
  const lines: string[] = [];

  const traverse = (node: MindMapNode, level: number) => {
    const prefix = '#'.repeat(Math.min(level, 6));
    lines.push(`${prefix} ${node.topic}`);

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        traverse(child, level + 1);
      });
    }
  };

  traverse(data.nodeData, 1);

  // 收集节点ID映射
  const nodeIds = collectNodeIds(data.nodeData);

  // 构建 meta 对象
  const meta: MindMapMeta = {
    direction: data.direction,
    arrows: data.arrows,
    summaries: data.summaries,
    nodeIds: nodeIds,
  };
  const metaComment = generateMetaComment(meta);

  return metaComment + lines.join('\n');
};

// ============ 组件实现 ============

interface MindMapBlockProps {
  markdown: string;
  onMarkdownChange: (markdown: string) => void;
  editable: boolean;
}

const MindMapBlockComponent: React.FC<MindMapBlockProps> = ({
  markdown,
  onMarkdownChange,
  editable,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindElixirRef = useRef<MindElixirInstance | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [sourceText, setSourceText] = useState(markdown);
  const [error, setError] = useState<string | null>(null);
  const isInitializedRef = useRef(false);
  const lastMarkdownRef = useRef(markdown);
  const metaRef = useRef<MindMapMeta>({});
  // 保存最新的 onMarkdownChange 引用，避免闭包问题
  const onMarkdownChangeRef = useRef(onMarkdownChange);
  onMarkdownChangeRef.current = onMarkdownChange;

  // 默认内容
  const defaultMarkdown = `# 思维导图
## 主题1
### 子主题1.1
### 子主题1.2
## 主题2
### 子主题2.1
### 子主题2.2`;

  const currentMarkdown = markdown || defaultMarkdown;

  // 获取 MindElixir direction 常量
  // MindElixir: LEFT=0, RIGHT=1, SIDE=2
  const getDirection = (dir?: number): 0 | 1 | 2 => {
    if (dir === 0 || dir === 1 || dir === 2) return dir;
    return MindElixir.SIDE; // 默认 SIDE (2)
  };

  // 初始化 MindElixir
  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return;

    let resizeObserver: ResizeObserver | null = null;
    let initTimeout: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    let animationFrameId: number | null = null;
    let arrowDeltaTimer: ReturnType<typeof setTimeout> | null = null;

    // 延迟初始化，确保容器尺寸已确定
    const initMindElixir = () => {
      if (!containerRef.current || !isMounted) return;

      try {
        setError(null);
        const data = markdownToMindElixir(currentMarkdown);

        // 保存 meta 信息
        metaRef.current = {
          direction: data.direction,
          arrows: data.arrows,
          summaries: data.summaries,
        };

        const options = {
          el: containerRef.current,
          direction: getDirection(data.direction),
          draggable: editable,
          contextMenu: editable,
          toolBar: editable,
          nodeMenu: editable,
          keypress: editable,
          allowUndo: editable,
          locale: 'zh_CN' as const,
        };

        const mind = new MindElixir(options);
        // 转换为 MindElixir 期望的格式
        const mindElixirData = {
          nodeData: data.nodeData,
          direction: getDirection(data.direction),
          arrows: data.arrows,
          summaries: data.summaries,
        };
        mind.init(mindElixirData);
        mindElixirRef.current = mind;
        isInitializedRef.current = true;

        // 初始化后多次刷新和居中，确保连线正确绘制
        const refreshAndCenter = () => {
          if (!isMounted || !mindElixirRef.current) return;
          try {
            // 刷新数据以重新绘制连线
            mindElixirRef.current.refresh(mindElixirData);
            mindElixirRef.current.toCenter();
          } catch (e) {
            console.warn('[MindMapBlock] Error during refresh:', e);
          }
        };

        // 使用多次延迟确保连线正确绘制
        animationFrameId = requestAnimationFrame(refreshAndCenter);
        timeoutIds.push(setTimeout(refreshAndCenter, 50));
        timeoutIds.push(setTimeout(refreshAndCenter, 150));
        timeoutIds.push(setTimeout(refreshAndCenter, 300));

        // 监听容器尺寸变化，自动适应宽度
        resizeObserver = new ResizeObserver(() => {
          if (!isMounted || !mindElixirRef.current) return;
          requestAnimationFrame(() => {
            if (isMounted && mindElixirRef.current) {
              try {
                mindElixirRef.current.toCenter();
              } catch (_e) {
                // 忽略错误
              }
            }
          });
        });
        resizeObserver.observe(containerRef.current);

        // 监听数据变化
        if (editable) {
          // 保存数据的通用函数
          const saveData = () => {
            if (!isMounted || !mindElixirRef.current) return;
            try {
              const rawData = mind.getData();
              // 转换为内部数据格式
              const newData: MindMapData = {
                nodeData: rawData.nodeData as MindMapNode,
                direction: rawData.direction,
                arrows: rawData.arrows as Arrow[] | undefined,
                summaries: rawData.summaries as Summary[] | undefined,
              };
              const newMarkdown = mindElixirToMarkdown(newData);
              console.log(
                '[MindMapBlock] Data changed, new markdown:',
                newMarkdown
              );
              if (newMarkdown !== lastMarkdownRef.current) {
                lastMarkdownRef.current = newMarkdown;
                setSourceText(newMarkdown);
                // 使用 ref 获取最新的 onMarkdownChange，避免闭包问题
                onMarkdownChangeRef.current(newMarkdown);
              }
            } catch (e) {
              console.warn('[MindMapBlock] Error saving data:', e);
            }
          };

          // 监听节点操作事件
          mind.bus.addListener('operation', () => {
            console.log('[MindMapBlock] Operation detected');
            saveData();
          });

          // 监听箭头 delta 变化事件（拖动箭头控制点调整角度）
          // 使用节流防止频繁触发
          mind.bus.addListener('updateArrowDelta', (arrow: Arrow) => {
            console.log('[MindMapBlock] Arrow delta updated:', arrow);
            if (arrowDeltaTimer) {
              clearTimeout(arrowDeltaTimer);
            }
            arrowDeltaTimer = setTimeout(() => {
              saveData();
              arrowDeltaTimer = null;
            }, 300);
          });
        }
      } catch (err) {
        console.error('MindElixir initialization error:', err);
        setError(err instanceof Error ? err.message : '思维导图初始化失败');
      }
    };

    // 延迟初始化，等待 DOM 布局完成
    initTimeout = setTimeout(() => {
      if (isMounted) {
        animationFrameId = requestAnimationFrame(initMindElixir);
      }
    }, 50);

    return () => {
      isMounted = false;

      // 清理所有定时器
      if (initTimeout) clearTimeout(initTimeout);
      if (arrowDeltaTimer) clearTimeout(arrowDeltaTimer);
      timeoutIds.forEach(id => clearTimeout(id));
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      resizeObserver?.disconnect();

      // 清理 MindElixir 实例
      if (mindElixirRef.current) {
        try {
          // 尝试调用 destroy 方法（如果存在）
          if (typeof (mindElixirRef.current as any).destroy === 'function') {
            (mindElixirRef.current as any).destroy();
          }
        } catch (e) {
          console.warn('[MindMapBlock] Error destroying instance:', e);
        }
        mindElixirRef.current = null;
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      isInitializedRef.current = false;
    };
  }, [editable]);

  // 外部 markdown 变化时更新
  useEffect(() => {
    if (mindElixirRef.current && markdown !== lastMarkdownRef.current) {
      const data = markdownToMindElixir(markdown || defaultMarkdown);
      // 更新 meta 信息
      metaRef.current = {
        direction: data.direction,
        arrows: data.arrows,
        summaries: data.summaries,
      };
      // 转换为 MindElixir 期望的格式
      const mindElixirData = {
        nodeData: data.nodeData,
        direction: getDirection(data.direction),
        arrows: data.arrows,
        summaries: data.summaries,
      };
      mindElixirRef.current.refresh(mindElixirData);
      lastMarkdownRef.current = markdown;
      setSourceText(markdown);
    }
  }, [markdown]);

  // 切换源码模式
  const handleSourceChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSourceText(e.target.value);
    },
    []
  );

  const applySourceChanges = useCallback(() => {
    if (mindElixirRef.current && sourceText !== lastMarkdownRef.current) {
      const data = markdownToMindElixir(sourceText);
      // 更新 meta 信息
      metaRef.current = {
        direction: data.direction,
        arrows: data.arrows,
        summaries: data.summaries,
      };
      // 转换为 MindElixir 期望的格式
      const mindElixirData = {
        nodeData: data.nodeData,
        direction: getDirection(data.direction),
        arrows: data.arrows,
        summaries: data.summaries,
      };
      mindElixirRef.current.refresh(mindElixirData);
      lastMarkdownRef.current = sourceText;
      onMarkdownChange(sourceText);
    }
    setShowSource(false);
    // 切换回可视化后居中
    requestAnimationFrame(() => {
      mindElixirRef.current?.toCenter();
    });
  }, [sourceText, onMarkdownChange]);

  // 取消源码编辑，切换回可视化
  const cancelSourceEdit = useCallback(() => {
    setShowSource(false);
    setSourceText(lastMarkdownRef.current);
    // 切换回可视化后居中
    requestAnimationFrame(() => {
      mindElixirRef.current?.toCenter();
    });
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // 全屏切换后需要重新调整视图
    setTimeout(() => {
      mindElixirRef.current?.toCenter();
    }, 100);
  };

  return (
    <div
      className={`
        w-full border border-border rounded-lg bg-background my-2
        ${isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : ''}
      `}
      contentEditable={false}
      style={{ maxWidth: '100%' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span>思维导图</span>
          {editable && (
            <span className="hidden md:inline ml-2 text-xs text-muted-foreground font-normal">
              双击节点编辑 | Tab添加子节点 | Enter添加兄弟节点
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {editable && (
            <button
              type="button"
              onClick={() => setShowSource(!showSource)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground bg-transparent border-none rounded-md cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
              title={showSource ? '可视化编辑' : '源码编辑'}
            >
              {showSource ? <Eye size={16} /> : <Code size={16} />}
              <span>{showSource ? '可视化' : '源码'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-8 h-8 text-muted-foreground bg-transparent border-none rounded-md cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
            title={isFullscreen ? '退出全屏' : '全屏'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="relative overflow-hidden"
        style={{ height: isFullscreen ? 'calc(100vh - 60px)' : '400px' }}
      >
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <AlertCircle size={48} className="text-destructive mb-3" />
            <p className="text-lg font-semibold text-destructive mb-1">
              渲染失败
            </p>
            <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            {editable && (
              <button
                type="button"
                onClick={() => setShowSource(true)}
                className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                切换到源码模式
              </button>
            )}
          </div>
        ) : (
          <>
            {showSource && (
              <div className="absolute inset-0 z-10 flex flex-col bg-background h-full">
                <textarea
                  value={sourceText}
                  onChange={handleSourceChange}
                  className="flex-1 w-full p-4 font-mono text-sm bg-muted/30 border-none resize-none focus:outline-none focus:ring-0 min-h-0"
                  placeholder="# 根节点&#10;## 子节点&#10;### 子子节点"
                />
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/20 shrink-0">
                  <button
                    type="button"
                    onClick={cancelSourceEdit}
                    className="px-3 py-1.5 text-sm text-muted-foreground bg-transparent border border-border rounded-md hover:bg-accent transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={applySourceChanges}
                    className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    应用更改
                  </button>
                </div>
              </div>
            )}
            <div
              ref={containerRef}
              className="w-full h-full [&_.map-container]:!w-full [&_.map-container]:!h-full [&_.mind-elixir]:!w-full [&_.mind-elixir]:!h-full"
              style={{ display: showSource ? 'none' : 'block' }}
            />
          </>
        )}
      </div>
    </div>
  );
};

// 导出HTML组件(用于markdown转换)
const MindMapBlockExternalHTML: React.FC<
  ReactCustomBlockRenderProps<any, any, any>
> = ({ block }) => {
  const { markdown = '' } = block.props;

  // Debug: 查看导出时的 block 结构
  console.log(
    '[MindMapBlock toExternalHTML] block:',
    JSON.stringify(block, null, 2)
  );
  console.log('[MindMapBlock toExternalHTML] markdown:', markdown);

  return (
    <pre data-mindmap="true">
      <code className="language-markmap">{markdown}</code>
    </pre>
  );
};

// 创建自定义块规范
const createCustomMindMapBlock = createReactBlockSpec(
  {
    type: 'mindMap',
    propSchema: {
      markdown: { default: '' },
    },
    content: 'none',
  },
  {
    render: (props: ReactCustomBlockRenderProps<any, any, any>) => {
      const { block, editor } = props;
      const { markdown = '' } = block.props;

      return (
        <MindMapBlockComponent
          markdown={markdown}
          editable={editor.isEditable}
          onMarkdownChange={newMarkdown => {
            editor.updateBlock(block, {
              props: { ...block.props, markdown: newMarkdown },
            });
          }}
        />
      );
    },
    toExternalHTML: MindMapBlockExternalHTML,
    parse: (element: HTMLElement) => {
      if (element.tagName === 'PRE') {
        // 方案1: 有 data-mindmap 属性 (来自 toExternalHTML)
        if (element.hasAttribute('data-mindmap')) {
          const codeEl = element.querySelector('code.language-markmap');
          if (codeEl) {
            return { markdown: codeEl.textContent || '' };
          }
        }
        // 方案2: code 元素有 language-markmap class (来自 markdown 解析)
        const codeEl = element.querySelector('code.language-markmap');
        if (codeEl) {
          return { markdown: codeEl.textContent || '' };
        }
      }
      return undefined;
    },
  }
);

// 导出块规范实例
export const MindMapBlock = createCustomMindMapBlock();
