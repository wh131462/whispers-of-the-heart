import { cn } from '@/lib/utils';
import type { PanelGroup } from '../types';

type Props = {
  groups: PanelGroup[];
  currentId: string;
  onSelect: (id: string) => void;
};

export function Sidebar({ groups, currentId, onSelect }: Props) {
  return (
    <aside className="flex h-full w-56 flex-col overflow-y-auto border-r border-zinc-200 bg-white/95">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">屏幕检测器</h2>
        <p className="mt-0.5 text-xs text-zinc-500">点击项目开始检测</p>
      </div>
      <nav className="flex-1 px-2 py-2">
        {groups.map(group => (
          <div key={group.category} className="mb-3">
            <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              {group.title}
            </div>
            <ul className="mt-1 space-y-0.5">
              {group.panels.map(panel => {
                const active = panel.id === currentId;
                return (
                  <li key={panel.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(panel.id)}
                      className={cn(
                        'block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                        active
                          ? 'bg-zinc-100 font-medium text-zinc-900'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                      )}
                    >
                      {panel.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
