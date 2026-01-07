import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TreeNode } from '../types';

interface JsonTreeViewProps {
  data: TreeNode | null;
}

export function JsonTreeView({ data }: JsonTreeViewProps) {
  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        输入有效的 JSON 以查看树形结构
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex-1 min-h-0 overflow-auto p-4',
        'bg-zinc-50 rounded-lg',
        'border border-zinc-200',
        'font-mono text-sm',
        'scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent'
      )}
    >
      <TreeNodeItem node={data} isRoot />
    </div>
  );
}

interface TreeNodeItemProps {
  node: TreeNode;
  isRoot?: boolean;
}

function TreeNodeItem({ node, isRoot }: TreeNodeItemProps) {
  const [expanded, setExpanded] = useState(node.expanded ?? true);

  const toggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const hasChildren = node.children && node.children.length > 0;
  const isExpandable = node.type === 'object' || node.type === 'array';

  // 值的渲染
  const renderValue = () => {
    switch (node.type) {
      case 'string':
        return (
          <span className="text-emerald-600">
            &quot;{String(node.value)}&quot;
          </span>
        );
      case 'number':
        return <span className="text-amber-600">{String(node.value)}</span>;
      case 'boolean':
        return (
          <span className="text-purple-600">
            {node.value ? 'true' : 'false'}
          </span>
        );
      case 'null':
        return <span className="text-zinc-500">null</span>;
      case 'array':
        return (
          <span className="text-zinc-500">[{node.children?.length ?? 0}]</span>
        );
      case 'object':
        return (
          <span className="text-zinc-500">
            {'{'}
            {node.children?.length ?? 0}
            {'}'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn(!isRoot && 'ml-4')}>
      <div
        className={cn(
          'flex items-center gap-1 py-0.5',
          isExpandable && 'cursor-pointer hover:bg-zinc-100 rounded'
        )}
        onClick={isExpandable ? toggle : undefined}
      >
        {/* 展开/折叠图标 */}
        {isExpandable ? (
          expanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
          )
        ) : (
          <span className="w-4" />
        )}

        {/* 键名 */}
        {!isRoot && (
          <>
            <span className="text-sky-600">{node.key}</span>
            <span className="text-zinc-400">:</span>
          </>
        )}

        {/* 值或类型标记 */}
        {(!isExpandable || !expanded) && renderValue()}

        {/* 展开状态下显示括号 */}
        {isExpandable && expanded && (
          <span className="text-zinc-500">
            {node.type === 'array' ? '[' : '{'}
          </span>
        )}
      </div>

      {/* 子节点 */}
      {isExpandable && expanded && hasChildren && (
        <div className="border-l border-zinc-200 ml-2">
          {node.children!.map((child, index) => (
            <TreeNodeItem key={`${child.key}-${index}`} node={child} />
          ))}
        </div>
      )}

      {/* 闭合括号 */}
      {isExpandable && expanded && (
        <div className={cn(!isRoot && 'ml-4', 'text-zinc-500')}>
          {node.type === 'array' ? ']' : '}'}
        </div>
      )}
    </div>
  );
}
