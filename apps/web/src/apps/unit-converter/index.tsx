import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConverterShell } from './components/ConverterShell';
import { CategoryTabs } from './components/CategoryTabs';
import { UnitInput } from './components/UnitInput';
import { UnitSelector } from './components/UnitSelector';
import { ConversionResult } from './components/ConversionResult';
import { useUnitConverter } from './hooks/useUnitConverter';

export default function UnitConverter() {
  const {
    state,
    result,
    currentCategory,
    previews,
    setCategory,
    setFromUnit,
    setToUnit,
    setFromValue,
    swapUnits,
  } = useUnitConverter();

  const units = currentCategory?.units || [];

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <ConverterShell>
        {/* 分类选择 */}
        <CategoryTabs
          activeCategory={state.category}
          onCategoryChange={setCategory}
        />

        {/* 转换区域 */}
        <div className="space-y-3">
          {/* 源单位 */}
          <div className="flex items-end gap-2">
            <UnitInput
              value={state.fromValue}
              onChange={setFromValue}
              label="输入"
            />
            <UnitSelector
              units={units}
              selectedUnit={state.fromUnit}
              onUnitChange={setFromUnit}
            />
          </div>

          {/* 交换按钮 */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={swapUnits}
              className={cn(
                'p-2 rounded-full',
                'bg-zinc-100 border border-zinc-200',
                'text-zinc-600',
                'transition-all duration-150',
                'hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-700',
                'active:scale-95'
              )}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* 目标单位 */}
          <div className="flex items-end gap-2">
            <UnitInput
              value={result}
              onChange={() => {}}
              readOnly
              label="结果"
            />
            <UnitSelector
              units={units}
              selectedUnit={state.toUnit}
              onUnitChange={setToUnit}
            />
          </div>
        </div>

        {/* 常用转换预览 */}
        <ConversionResult previews={previews} />
      </ConverterShell>
    </div>
  );
}
