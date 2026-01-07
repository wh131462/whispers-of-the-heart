import { useState } from 'react';
import { ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommonPattern } from '../types';
import { commonPatterns } from '../utils/commonPatterns';

interface CheatSheetProps {
  onSelectPattern: (pattern: CommonPattern) => void;
}

export function CheatSheet({ onSelectPattern }: CheatSheetProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn('bg-zinc-50 rounded-lg', 'border border-zinc-200')}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2',
          'text-sm text-zinc-600',
          'hover:text-zinc-800 transition-colors'
        )}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <Lightbulb className="w-4 h-4" />
        <span>常用正则表达式</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {commonPatterns.map(pattern => (
              <button
                key={pattern.id}
                onClick={() => onSelectPattern(pattern)}
                className={cn(
                  'flex flex-col items-start gap-0.5 p-2 rounded-md',
                  'bg-zinc-100 text-left',
                  'hover:bg-zinc-200 transition-colors'
                )}
              >
                <span className="text-xs font-medium text-zinc-800">
                  {pattern.name}
                </span>
                <span className="text-xs text-zinc-500 line-clamp-1">
                  {pattern.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
