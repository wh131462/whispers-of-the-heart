import { cn } from '@/lib/utils';
import type { UnitDef } from '../types';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface UnitSelectorProps {
  units: UnitDef[];
  selectedUnit: string;
  onUnitChange: (unitId: string) => void;
}

export function UnitSelector({
  units,
  selectedUnit,
  onUnitChange,
}: UnitSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = units.find(u => u.id === selectedUnit);

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-32">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2.5',
          'bg-zinc-50',
          'border border-zinc-300',
          'rounded-lg',
          'text-sm text-zinc-800',
          'transition-all duration-150',
          'hover:bg-zinc-100',
          isOpen && 'border-zinc-400 ring-1 ring-zinc-200'
        )}
      >
        <span className="truncate">
          {selected?.symbol || selected?.name || '选择'}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-zinc-500 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 top-full left-0 right-0 mt-1',
            'bg-white',
            'border border-zinc-200',
            'rounded-lg',
            'shadow-lg shadow-zinc-200/50',
            'max-h-64 overflow-y-auto'
          )}
        >
          {units.map(unit => (
            <button
              key={unit.id}
              type="button"
              onClick={() => {
                onUnitChange(unit.id);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2',
                'text-sm text-left',
                'transition-colors duration-100',
                unit.id === selectedUnit
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-zinc-700 hover:bg-zinc-100'
              )}
            >
              <span className="w-12 font-mono text-xs text-zinc-500">
                {unit.symbol}
              </span>
              <span className="truncate">{unit.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
