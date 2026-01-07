import {
  Play,
  Copy,
  Download,
  Trash2,
  ArrowLeftRight,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InputMode, Direction } from '../types';

interface ActionButtonsProps {
  mode: InputMode;
  direction: Direction;
  hasInput: boolean;
  hasOutput: boolean;
  copied: boolean;
  onProcess: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onClear: () => void;
  onSwap: () => void;
  onModeChange: (mode: InputMode) => void;
  onDirectionChange: (direction: Direction) => void;
}

export function ActionButtons({
  mode,
  direction,
  hasInput,
  hasOutput,
  copied,
  onProcess,
  onCopy,
  onDownload,
  onClear,
  onSwap,
  onModeChange,
  onDirectionChange,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* 模式和方向选择 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 输入模式 */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg">
          <ToggleButton
            active={mode === 'text'}
            onClick={() => onModeChange('text')}
          >
            文本
          </ToggleButton>
          <ToggleButton
            active={mode === 'file'}
            onClick={() => onModeChange('file')}
          >
            文件
          </ToggleButton>
        </div>

        {/* 编码/解码 */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg">
          <ToggleButton
            active={direction === 'encode'}
            onClick={() => onDirectionChange('encode')}
          >
            编码
          </ToggleButton>
          <ToggleButton
            active={direction === 'decode'}
            onClick={() => onDirectionChange('decode')}
          >
            解码
          </ToggleButton>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap items-center gap-2">
        <ActionButton
          icon={<Play className="w-4 h-4" />}
          label={direction === 'encode' ? '编码' : '解码'}
          onClick={onProcess}
          disabled={!hasInput}
          primary
        />
        <ActionButton
          icon={<ArrowLeftRight className="w-4 h-4" />}
          label="交换"
          onClick={onSwap}
          disabled={!hasOutput}
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
          disabled={!hasOutput && !hasInput}
        />
        <ActionButton
          icon={<Download className="w-4 h-4" />}
          label="下载"
          onClick={onDownload}
          disabled={!hasOutput}
        />
        <ActionButton
          icon={<Trash2 className="w-4 h-4" />}
          label="清空"
          onClick={onClear}
          disabled={!hasInput && !hasOutput}
        />
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
        'px-3 py-1 rounded-md text-sm font-medium transition-colors',
        active
          ? 'bg-emerald-100 text-emerald-700'
          : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-800'
      )}
    >
      {children}
    </button>
  );
}
