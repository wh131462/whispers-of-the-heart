import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { PasswordOptions } from '../types';

interface CharacterOptionsProps {
  options: PasswordOptions;
  onChange: (options: Partial<PasswordOptions>) => void;
}

interface OptionItem {
  key: keyof PasswordOptions;
  label: string;
  description: string;
}

const optionItems: OptionItem[] = [
  { key: 'uppercase', label: '大写字母', description: 'A-Z' },
  { key: 'lowercase', label: '小写字母', description: 'a-z' },
  { key: 'numbers', label: '数字', description: '0-9' },
  { key: 'symbols', label: '符号', description: '!@#$%^&*' },
  { key: 'excludeAmbiguous', label: '排除易混淆字符', description: '0O1lI' },
];

export function CharacterOptions({ options, onChange }: CharacterOptionsProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-zinc-600 mb-3">字符类型</div>

      {optionItems.map(item => {
        const isChecked = options[item.key] as boolean;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange({ [item.key]: !isChecked })}
            className={cn(
              'w-full flex items-center gap-3 p-2.5',
              'rounded-lg',
              'transition-all duration-150',
              'border',
              isChecked
                ? 'bg-zinc-100 border-zinc-300'
                : 'bg-white border-zinc-200 hover:bg-zinc-50'
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded',
                'border',
                'flex items-center justify-center',
                'transition-colors duration-150',
                isChecked ? 'bg-zinc-700 border-zinc-700' : 'border-zinc-400'
              )}
            >
              {isChecked && <Check className="w-3 h-3 text-white" />}
            </div>

            <div className="flex-1 text-left">
              <span
                className={cn(
                  'text-sm',
                  isChecked ? 'text-zinc-800' : 'text-zinc-600'
                )}
              >
                {item.label}
              </span>
              <span className="ml-2 text-xs text-zinc-500">
                {item.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
