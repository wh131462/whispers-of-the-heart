import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw, Home } from 'lucide-react';
import type { PlayerSide } from '../types';
import { GAME_CONFIG } from '../types';

interface GameOverModalProps {
  winner: PlayerSide | 'draw' | null;
  leftScore: number;
  rightScore: number;
  onRestart: () => void;
  onQuit: () => void;
  isOnline?: boolean;
  myRole?: PlayerSide | null;
}

export default function GameOverModal({
  winner,
  leftScore,
  rightScore,
  onRestart,
  onQuit,
  isOnline = false,
  myRole,
}: GameOverModalProps) {
  const getWinnerText = () => {
    if (winner === 'draw') return '平局！';
    if (isOnline && myRole) {
      return winner === myRole ? '你赢了！' : '你输了...';
    }
    return winner === 'left' ? '左方获胜！' : '右方获胜！';
  };

  const getWinnerColor = () => {
    if (winner === 'draw') return '#ffc107';
    if (isOnline && myRole) {
      return winner === myRole ? '#4caf50' : '#f44336';
    }
    return winner === 'left'
      ? GAME_CONFIG.LEFT_SLIME_COLOR
      : GAME_CONFIG.RIGHT_SLIME_COLOR;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900/95 rounded-lg p-4 max-w-xs w-full mx-3 shadow-2xl border border-gray-700 text-center">
        {/* 奖杯图标 */}
        <div
          className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${getWinnerColor()}20` }}
        >
          <Trophy className="w-7 h-7" style={{ color: getWinnerColor() }} />
        </div>

        {/* 结果文字 */}
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: getWinnerColor() }}
        >
          {getWinnerText()}
        </h2>

        {/* 比分 */}
        <div className="flex items-center justify-center gap-3 my-4">
          <div className="text-center">
            <div
              className="w-8 h-8 rounded-full mx-auto mb-1"
              style={{ backgroundColor: GAME_CONFIG.LEFT_SLIME_COLOR }}
            />
            <span className="text-2xl font-bold text-white">{leftScore}</span>
          </div>
          <span className="text-xl text-gray-500">-</span>
          <div className="text-center">
            <div
              className="w-8 h-8 rounded-full mx-auto mb-1"
              style={{ backgroundColor: GAME_CONFIG.RIGHT_SLIME_COLOR }}
            />
            <span className="text-2xl font-bold text-white">{rightScore}</span>
          </div>
        </div>

        {/* 按钮 */}
        <div className="space-y-2">
          <Button
            className="w-full bg-green-600 hover:bg-green-500 text-sm py-2"
            onClick={onRestart}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            再来一局
          </Button>
          <Button
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 text-sm py-2"
            onClick={onQuit}
          >
            <Home className="w-4 h-4 mr-1" />
            返回菜单
          </Button>
        </div>
      </div>
    </div>
  );
}
