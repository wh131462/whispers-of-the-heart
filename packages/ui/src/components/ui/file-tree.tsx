'use client';

import { useState } from 'react';
import { cn } from '../../lib/utils';

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  extension?: string;
  id?: string;
  data?: unknown;
}

export interface FileTreeProps {
  data: FileNode[];
  className?: string;
  onSelect?: (node: FileNode) => void;
  selectedId?: string;
  header?: string;
}

interface FileItemProps {
  node: FileNode;
  depth: number;
  isLast: boolean;
  parentPath: boolean[];
  onSelect?: (node: FileNode) => void;
  selectedId?: string;
}

const getFileIcon = (extension?: string) => {
  const iconMap: Record<string, { color: string; icon: string }> = {
    tsx: { color: 'text-blue-500', icon: '⚛' },
    ts: { color: 'text-blue-600', icon: '◆' },
    jsx: { color: 'text-cyan-500', icon: '⚛' },
    js: { color: 'text-yellow-500', icon: '◆' },
    css: { color: 'text-purple-500', icon: '◈' },
    json: { color: 'text-yellow-600', icon: '{}' },
    md: { color: 'text-muted-foreground', icon: '◊' },
    svg: { color: 'text-green-500', icon: '◐' },
    png: { color: 'text-green-600', icon: '◑' },
    jpg: { color: 'text-green-600', icon: '◑' },
    jpeg: { color: 'text-green-600', icon: '◑' },
    gif: { color: 'text-green-600', icon: '◑' },
    webp: { color: 'text-green-600', icon: '◑' },
    mp4: { color: 'text-purple-500', icon: '▶' },
    webm: { color: 'text-purple-500', icon: '▶' },
    mp3: { color: 'text-green-500', icon: '♪' },
    wav: { color: 'text-green-500', icon: '♪' },
    pdf: { color: 'text-red-500', icon: '◇' },
    default: { color: 'text-muted-foreground', icon: '◇' },
  };
  return iconMap[extension || 'default'] || iconMap.default;
};

function FileItem({
  node,
  depth,
  isLast,
  parentPath,
  onSelect,
  selectedId,
}: FileItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const isFolder = node.type === 'folder';
  const hasChildren = isFolder && node.children && node.children.length > 0;
  const fileIcon = getFileIcon(node.extension);
  const isSelected = node.id === selectedId;

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    }
    onSelect?.(node);
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          'group relative flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer',
          'transition-all duration-200 ease-out',
          isHovered && 'bg-muted/50',
          isSelected && 'bg-primary/10 ring-1 ring-primary/30'
        )}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Tree lines */}
        {depth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 flex"
            style={{ left: `${(depth - 1) * 16 + 16}px` }}
          >
            <div
              className={cn(
                'w-px transition-colors duration-200',
                isHovered ? 'bg-primary/40' : 'bg-border/50'
              )}
            />
          </div>
        )}

        {/* Folder/File indicator */}
        <div
          className={cn(
            'flex items-center justify-center w-4 h-4 transition-transform duration-200 ease-out',
            isFolder && isOpen && 'rotate-90'
          )}
        >
          {isFolder ? (
            <svg
              width="6"
              height="8"
              viewBox="0 0 6 8"
              fill="none"
              className={cn(
                'transition-colors duration-200',
                isHovered ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <path
                d="M1 1L5 4L1 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <span
              className={cn(
                'text-xs transition-opacity duration-200',
                fileIcon.color
              )}
            >
              {fileIcon.icon}
            </span>
          )}
        </div>

        {/* Icon */}
        <div
          className={cn(
            'flex items-center justify-center w-5 h-5 rounded transition-all duration-200',
            isFolder
              ? isHovered
                ? 'text-yellow-500 scale-110'
                : 'text-yellow-500/80'
              : isHovered
                ? cn(fileIcon.color, 'scale-110')
                : cn(fileIcon.color, 'opacity-70')
          )}
        >
          {isFolder ? (
            <svg width="16" height="14" viewBox="0 0 16 14" fill="currentColor">
              <path d="M1.5 1C0.671573 1 0 1.67157 0 2.5V11.5C0 12.3284 0.671573 13 1.5 13H14.5C15.3284 13 16 12.3284 16 11.5V4.5C16 3.67157 15.3284 3 14.5 3H8L6.5 1H1.5Z" />
            </svg>
          ) : (
            <svg
              width="14"
              height="16"
              viewBox="0 0 14 16"
              fill="currentColor"
              opacity="0.8"
            >
              <path d="M1.5 0C0.671573 0 0 0.671573 0 1.5V14.5C0 15.3284 0.671573 16 1.5 16H12.5C13.3284 16 14 15.3284 14 14.5V4.5L9.5 0H1.5Z" />
              <path d="M9 0V4.5H14" fill="currentColor" fillOpacity="0.5" />
            </svg>
          )}
        </div>

        {/* Name */}
        <span
          className={cn(
            'font-mono text-sm transition-colors duration-200',
            isFolder
              ? isHovered
                ? 'text-foreground'
                : 'text-foreground/90'
              : isHovered
                ? 'text-foreground'
                : 'text-muted-foreground',
            isSelected && 'text-primary font-medium'
          )}
        >
          {node.name}
        </span>

        {/* Hover indicator */}
        <div
          className={cn(
            'absolute right-2 w-1.5 h-1.5 rounded-full bg-primary transition-all duration-200',
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
          )}
        />
      </div>

      {/* Children with animated height */}
      {hasChildren && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-out',
            isOpen ? 'opacity-100' : 'opacity-0 h-0'
          )}
          style={{
            maxHeight: isOpen ? `${node.children!.length * 100}px` : '0px',
          }}
        >
          {node.children!.map((child, index) => (
            <FileItem
              key={child.id || child.name}
              node={child}
              depth={depth + 1}
              isLast={index === node.children!.length - 1}
              parentPath={[...parentPath, !isLast]}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({
  data,
  className,
  onSelect,
  selectedId,
  header = 'explorer',
}: FileTreeProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-lg border border-border/50 p-3 font-mono',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 mb-2 border-b border-border/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        </div>
        <span className="text-xs text-muted-foreground ml-2">{header}</span>
      </div>

      {/* Tree */}
      <div className="space-y-0.5">
        {data.map((node, index) => (
          <FileItem
            key={node.id || node.name}
            node={node}
            depth={0}
            isLast={index === data.length - 1}
            parentPath={[]}
            onSelect={onSelect}
            selectedId={selectedId}
          />
        ))}
      </div>
    </div>
  );
}
