import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Users, Bot, Clock, Gamepad2 } from 'lucide-react';
import type { GameMode, MatchDuration, AIDifficulty } from '../types';
import { GAME_CONFIG } from '../types';

interface GameMenuProps {
  onStartGame: (
    mode: GameMode,
    duration: MatchDuration,
    difficulty?: AIDifficulty
  ) => void;
}

export default function GameMenu({ onStartGame }: GameMenuProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>('single');
  const [duration, setDuration] = useState<MatchDuration>(2);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');

  const handleStart = () => {
    onStartGame(
      selectedMode,
      duration,
      selectedMode === 'single' ? difficulty : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900/95 rounded-lg p-4 max-w-xs w-full mx-3 shadow-2xl border border-gray-700">
        <h1
          className="text-xl font-bold text-center mb-3"
          style={{ color: GAME_CONFIG.LEFT_SLIME_COLOR }}
        >
          史莱姆足球
        </h1>

        {/* 模式选择 */}
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={selectedMode === 'single' ? 'default' : 'outline'}
              className={`h-auto py-2 flex flex-col gap-1 text-sm ${
                selectedMode === 'single'
                  ? 'bg-cyan-600 hover:bg-cyan-500'
                  : 'border-gray-600'
              }`}
              onClick={() => setSelectedMode('single')}
            >
              <Bot className="w-4 h-4" />
              <span>单人模式</span>
            </Button>
            <Button
              variant={selectedMode === 'local' ? 'default' : 'outline'}
              className={`h-auto py-2 flex flex-col gap-1 text-sm ${
                selectedMode === 'local'
                  ? 'bg-cyan-600 hover:bg-cyan-500'
                  : 'border-gray-600'
              }`}
              onClick={() => setSelectedMode('local')}
            >
              <Users className="w-4 h-4" />
              <span>双人模式</span>
            </Button>
          </div>
        </div>

        {/* AI 难度（单人模式） */}
        {selectedMode === 'single' && (
          <div className="mb-2">
            <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Gamepad2 className="w-3 h-3" />
              AI 难度
            </label>
            <Select
              value={difficulty}
              onValueChange={v => setDifficulty(v as AIDifficulty)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">简单</SelectItem>
                <SelectItem value="medium">中等</SelectItem>
                <SelectItem value="hard">困难</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 比赛时长 */}
        <div className="mb-3">
          <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            比赛时长
          </label>
          <Select
            value={String(duration)}
            onValueChange={v => setDuration(Number(v) as MatchDuration)}
          >
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map(d => (
                <SelectItem key={d} value={String(d)}>
                  {d} 分钟
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 开始按钮 */}
        <Button
          className="w-full bg-green-600 hover:bg-green-500 text-sm py-2"
          onClick={handleStart}
        >
          <Play className="w-4 h-4 mr-1" />
          开始游戏
        </Button>

        {/* 操作说明 */}
        <div className="mt-3 text-[10px] text-gray-500 space-y-0.5">
          <p className="text-center font-medium text-gray-400 text-xs">
            操作说明
          </p>
          <div className="flex justify-between gap-2">
            <span style={{ color: GAME_CONFIG.LEFT_SLIME_COLOR }}>
              左: W跳 A/D移 S抓
            </span>
            <span style={{ color: GAME_CONFIG.RIGHT_SLIME_COLOR }}>
              右: ↑跳 ←/→移 ↓抓
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 暂停菜单
interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  duration: MatchDuration;
  onDurationChange: (d: MatchDuration) => void;
}

export function PauseMenu({
  onResume,
  onRestart,
  onQuit,
  duration,
  onDurationChange,
}: PauseMenuProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900/95 rounded-xl p-6 max-w-xs w-full mx-4 shadow-2xl border border-gray-700">
        <h2 className="text-2xl font-bold text-white text-center mb-6">暂停</h2>

        <div className="space-y-3">
          <Button
            className="w-full bg-green-600 hover:bg-green-500"
            onClick={onResume}
          >
            继续游戏
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 whitespace-nowrap">
              时长:
            </span>
            <Select
              value={String(duration)}
              onValueChange={v => onDurationChange(Number(v) as MatchDuration)}
            >
              <SelectTrigger className="flex-1 bg-gray-800 border-gray-600 text-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(d => (
                  <SelectItem key={d} value={String(d)}>
                    {d} 分钟
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="w-full border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
            onClick={onRestart}
          >
            重新开始
          </Button>

          <Button
            variant="outline"
            className="w-full border-gray-600 text-gray-400 hover:bg-gray-700"
            onClick={onQuit}
          >
            返回菜单
          </Button>
        </div>
      </div>
    </div>
  );
}
