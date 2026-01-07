import { cn } from '@/lib/utils';
import type { MatchResult } from '../types';

interface MatchDetailsProps {
  matches: MatchResult[];
}

export function MatchDetails({ matches }: MatchDetailsProps) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-zinc-600">
        匹配详情 ({matches.length} 个匹配)
      </label>
      <div
        className={cn(
          'max-h-[200px] overflow-auto',
          'bg-zinc-50 rounded-lg',
          'border border-zinc-200',
          'scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent'
        )}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                #
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                匹配内容
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                位置
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                捕获组
              </th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match, index) => (
              <tr
                key={index}
                className="border-b border-zinc-100 last:border-0"
              >
                <td className="px-3 py-2 text-zinc-500">{index + 1}</td>
                <td className="px-3 py-2">
                  <span className="font-mono text-emerald-700 bg-emerald-100 px-1 rounded">
                    {match.match}
                  </span>
                </td>
                <td className="px-3 py-2 text-zinc-600 font-mono">
                  {match.index}
                </td>
                <td className="px-3 py-2">
                  {match.groups.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {match.groups.map((group, i) => (
                        <span
                          key={i}
                          className="text-xs bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded font-mono"
                        >
                          ${i + 1}: {group}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
