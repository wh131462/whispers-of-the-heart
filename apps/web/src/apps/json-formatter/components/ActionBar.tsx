import { Wand2, Minimize2, Copy, Trash2, FileJson, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewMode, IndentSize } from '../types';

interface ActionBarProps {
  viewMode: ViewMode;
  indentSize: IndentSize;
  copied: boolean;
  hasInput: boolean;
  onFormat: () => void;
  onMinify: () => void;
  onCopy: () => void;
  onClear: () => void;
  onLoadSample: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onIndentSizeChange: (size: IndentSize) => void;
}

export function ActionBar({
  viewMode,
  indentSize,
  copied,
  hasInput,
  onFormat,
  onMinify,
  onCopy,
  onClear,
  onLoadSample,
  onViewModeChange,
  onIndentSizeChange,
}: ActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
      {/* 主要操作 */}
      <div className="flex items-center gap-1">
        <ActionButton
          icon={<Wand2 className="w-4 h-4" />}
          label="格式化"
          onClick={onFormat}
          disabled={!hasInput}
          primary
        />
        <ActionButton
          icon={<Minimize2 className="w-4 h-4" />}
          label="压缩"
          onClick={onMinify}
          disabled={!hasInput}
        />
        <ActionButton
          icon={
            copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )
          }
          label={copied ? '已复制' : '复制'}
          onClick={onCopy}
          disabled={!hasInput}
        />
        <ActionButton
          icon={<Trash2 className="w-4 h-4" />}
          label="清空"
          onClick={onClear}
          disabled={!hasInput}
        />
      </div>

      {/* 分隔线 */}
      <div className="h-6 w-px bg-zinc-300 mx-1" />

      {/* 示例 */}
      <ActionButton
        icon={<FileJson className="w-4 h-4" />}
        label="示例"
        onClick={onLoadSample}
      />

      {/* 右侧设置 */}
      <div className="flex-1" />

      {/* 缩进设置 */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-zinc-500 mr-1">缩进:</span>
        <ToggleButton
          active={indentSize === 2}
          onClick={() => onIndentSizeChange(2)}
        >
          2
        </ToggleButton>
        <ToggleButton
          active={indentSize === 4}
          onClick={() => onIndentSizeChange(4)}
        >
          4
        </ToggleButton>
      </div>

      {/* 视图模式 */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-zinc-500 mr-1">视图:</span>
        <ToggleButton
          active={viewMode === 'code'}
          onClick={() => onViewModeChange('code')}
        >
          代码
        </ToggleButton>
        <ToggleButton
          active={viewMode === 'tree'}
          onClick={() => onViewModeChange('tree')}
        >
          树形
        </ToggleButton>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  primary,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
        'text-sm font-medium transition-colors',
        primary
          ? cn(
              'bg-emerald-100 text-emerald-700',
              'hover:bg-emerald-200',
              'disabled:bg-zinc-100 disabled:text-zinc-400'
            )
          : cn(
              'bg-zinc-100 text-zinc-700',
              'hover:bg-zinc-200 hover:text-zinc-900',
              'disabled:bg-zinc-100 disabled:text-zinc-400'
            ),
        'disabled:cursor-not-allowed'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ToggleButton({ active, onClick, children }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded text-xs font-medium transition-colors',
        active
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-800'
      )}
    >
      {children}
    </button>
  );
}
