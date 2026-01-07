import { cn } from '@/lib/utils';
import { categories } from '../utils/units';
import type { UnitCategory } from '../types';
import {
  Ruler,
  Scale,
  Thermometer,
  Square,
  Box,
  Gauge,
  Clock,
  HardDrive,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Ruler,
  Scale,
  Thermometer,
  Square,
  Box,
  Gauge,
  Clock,
  HardDrive,
};

interface CategoryTabsProps {
  activeCategory: UnitCategory;
  onCategoryChange: (category: UnitCategory) => void;
}

export function CategoryTabs({
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map(cat => {
        const Icon = iconMap[cat.icon];
        const isActive = cat.id === activeCategory;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5',
              'rounded-lg',
              'text-xs font-medium',
              'transition-all duration-200',
              'border',
              isActive
                ? 'bg-zinc-100 border-zinc-300 text-zinc-800'
                : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700'
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
