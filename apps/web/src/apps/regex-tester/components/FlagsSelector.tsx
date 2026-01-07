import { cn } from '@/lib/utils';
import type { RegexFlags } from '../types';

interface FlagsSelectorProps {
  flags: RegexFlags;
  onChange: (flag: keyof RegexFlags, value: boolean) => void;
}

const flagOptions: Array<{
  key: keyof RegexFlags;
  label: string;
  flag: string;
  description: string;
}> = [
  { key: 'global', label: '全局', flag: 'g', description: '查找所有匹配' },
  {
    key: 'ignoreCase',
    label: '忽略大小写',
    flag: 'i',
    description: '不区分大小写',
  },
  {
    key: 'multiline',
    label: '多行',
    flag: 'm',
    description: '^$ 匹配行首行尾',
  },
  {
    key: 'dotAll',
    label: '点号匹配全部',
    flag: 's',
    description: '. 匹配换行符',
  },
  {
    key: 'unicode',
    label: 'Unicode',
    flag: 'u',
    description: '启用 Unicode 支持',
  },
];

export function FlagsSelector({ flags, onChange }: FlagsSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-zinc-600">标志</label>
      <div className="flex flex-wrap gap-2">
        {flagOptions.map(option => (
          <button
            key={option.key}
            onClick={() => onChange(option.key, !flags[option.key])}
            title={option.description}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md',
              'text-xs font-medium transition-colors',
              flags[option.key]
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-800'
            )}
          >
            <span className="font-mono">{option.flag}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
