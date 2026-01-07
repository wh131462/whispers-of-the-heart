import type { ConversionPreview } from '../types';

interface ConversionResultProps {
  previews: ConversionPreview[];
}

export function ConversionResult({ previews }: ConversionResultProps) {
  if (previews.length === 0) return null;

  return (
    <div className="mt-2 pt-3 border-t border-zinc-200">
      <div className="text-xs text-zinc-500 mb-2">常用转换</div>
      <div className="space-y-1">
        {previews.map((preview, index) => (
          <div key={index} className="text-xs font-mono text-zinc-600 py-0.5">
            {preview.ratio}
          </div>
        ))}
      </div>
    </div>
  );
}
