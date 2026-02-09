import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Bot, Globe } from 'lucide-react';
import { OfflineGame } from './components/OfflineGame';
import { OnlineGame } from './components/OnlineGame';

function generateDefaultName() {
  const names = ['牌神', '赌侠', '扑克王', '出牌手', '地主克星', '斗地主达人'];
  return (
    names[Math.floor(Math.random() * names.length)] +
    Math.floor(Math.random() * 100)
  );
}

export default function DouDiZhu() {
  const [activeTab, setActiveTab] = useState<'offline' | 'online'>('offline');
  const [userName, setUserName] = useState(generateDefaultName);

  return (
    <div className="w-full pt-4">
      {/* Tab 切换 */}
      <div className="flex justify-center gap-2 mb-3">
        <button
          onClick={() => setActiveTab('offline')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium',
            'transition-all duration-200 active:scale-95',
            activeTab === 'offline'
              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 shadow-md shadow-amber-500/30'
              : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/20 dark:hover:text-white/80'
          )}
        >
          <Bot className="w-3.5 h-3.5" />
          单机
        </button>
        <button
          onClick={() => setActiveTab('online')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium',
            'transition-all duration-200 active:scale-95',
            activeTab === 'online'
              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 shadow-md shadow-amber-500/30'
              : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/20 dark:hover:text-white/80'
          )}
        >
          <Globe className="w-3.5 h-3.5" />
          联机
        </button>
      </div>

      {activeTab === 'offline' ? (
        <OfflineGame />
      ) : (
        <OnlineGame userName={userName} onUserNameChange={setUserName} />
      )}
    </div>
  );
}
