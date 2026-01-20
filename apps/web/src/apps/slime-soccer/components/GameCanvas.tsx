import { useEffect, useRef, memo } from 'react';
import type { GameState } from '../types';
import { GAME_CONFIG } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  scale?: number;
}

const {
  FIELD_WIDTH,
  FIELD_HEIGHT,
  GROUND_HEIGHT,
  SLIME_RADIUS,
  BALL_RADIUS,
  GOAL_WIDTH,
  GOAL_HEIGHT,
  GOAL_POST_RADIUS,
  FIELD_COLOR,
  GROUND_COLOR,
  GOAL_COLOR,
  NET_COLOR,
  BALL_COLOR,
} = GAME_CONFIG;

function GameCanvas({ gameState, scale = 1 }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

    // 绘制背景
    ctx.fillStyle = FIELD_COLOR;
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

    // 绘制地面
    ctx.fillStyle = GROUND_COLOR;
    ctx.fillRect(0, FIELD_HEIGHT - GROUND_HEIGHT, FIELD_WIDTH, GROUND_HEIGHT);

    // 绘制中线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(FIELD_WIDTH / 2, 0);
    ctx.lineTo(FIELD_WIDTH / 2, FIELD_HEIGHT - GROUND_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制球门
    const drawGoal = (_x: number, isLeft: boolean) => {
      const goalTop = FIELD_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT;
      const goalLeft = isLeft ? 0 : FIELD_WIDTH - GOAL_WIDTH;

      // 球网背景
      ctx.fillStyle = NET_COLOR;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(goalLeft, goalTop, GOAL_WIDTH, GOAL_HEIGHT);
      ctx.globalAlpha = 1;

      // 绘制网格线
      ctx.strokeStyle = NET_COLOR;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;

      const gridSize = 15;
      // 垂直线
      for (let x = goalLeft; x <= goalLeft + GOAL_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, goalTop);
        ctx.lineTo(x, goalTop + GOAL_HEIGHT);
        ctx.stroke();
      }
      // 水平线
      for (let y = goalTop; y <= goalTop + GOAL_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(goalLeft, y);
        ctx.lineTo(goalLeft + GOAL_WIDTH, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // 球门柱 (垂直)
      ctx.fillStyle = GOAL_COLOR;
      ctx.fillRect(
        isLeft ? GOAL_WIDTH - GOAL_POST_RADIUS : FIELD_WIDTH - GOAL_WIDTH,
        goalTop,
        GOAL_POST_RADIUS,
        GOAL_HEIGHT
      );

      // 横梁
      ctx.fillRect(
        goalLeft,
        goalTop - GOAL_POST_RADIUS / 2,
        GOAL_WIDTH,
        GOAL_POST_RADIUS
      );
    };

    drawGoal(0, true);
    drawGoal(FIELD_WIDTH - GOAL_WIDTH, false);

    // 绘制史莱姆
    const drawSlime = (
      x: number,
      y: number,
      color: string,
      isGrabbing: boolean,
      isLeft: boolean
    ) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, SLIME_RADIUS, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // 眼睛
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(
        x - SLIME_RADIUS * 0.3,
        y - SLIME_RADIUS * 0.3,
        SLIME_RADIUS * 0.2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        x + SLIME_RADIUS * 0.3,
        y - SLIME_RADIUS * 0.3,
        SLIME_RADIUS * 0.2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 瞳孔 - 左边史莱姆朝右看，右边史莱姆朝左看
      const pupilOffset = isLeft ? 0.05 : -0.05;
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(
        x - SLIME_RADIUS * (0.3 - pupilOffset),
        y - SLIME_RADIUS * 0.25,
        SLIME_RADIUS * 0.1,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        x + SLIME_RADIUS * (0.3 + pupilOffset),
        y - SLIME_RADIUS * 0.25,
        SLIME_RADIUS * 0.1,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 抓球时的效果
      if (isGrabbing) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
          x,
          y - SLIME_RADIUS * 0.5,
          SLIME_RADIUS * 1.3,
          Math.PI * 0.8,
          Math.PI * 0.2
        );
        ctx.stroke();
      }
    };

    drawSlime(
      gameState.leftSlime.position.x,
      gameState.leftSlime.position.y,
      gameState.leftSlime.color,
      gameState.leftSlime.isGrabbing,
      true
    );
    drawSlime(
      gameState.rightSlime.position.x,
      gameState.rightSlime.position.y,
      gameState.rightSlime.color,
      gameState.rightSlime.isGrabbing,
      false
    );

    // 绘制球
    const ball = gameState.ball;
    ctx.save();
    ctx.translate(ball.position.x, ball.position.y);
    ctx.rotate(ball.rotation);

    // 球体
    ctx.fillStyle = BALL_COLOR;
    ctx.beginPath();
    ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // 球的花纹
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-BALL_RADIUS, 0);
    ctx.lineTo(BALL_RADIUS, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -BALL_RADIUS);
    ctx.lineTo(0, BALL_RADIUS);
    ctx.stroke();

    ctx.restore();

    // 绘制左侧分数 (Cyan Team)
    ctx.fillStyle = GAME_CONFIG.LEFT_SLIME_COLOR;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Cyan Team: ${gameState.leftScore}`, 20, 35);

    // 绘制右侧分数 (Red Team)
    ctx.fillStyle = GAME_CONFIG.RIGHT_SLIME_COLOR;
    ctx.textAlign = 'right';
    ctx.fillText(`${gameState.rightScore} : Red Team`, FIELD_WIDTH - 20, 35);

    // 绘制时间 (居中)
    const minutes = Math.floor(gameState.timeRemaining / 60000);
    const seconds = Math.floor((gameState.timeRemaining % 60000) / 1000);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      FIELD_WIDTH / 2,
      35
    );
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      width={FIELD_WIDTH}
      height={FIELD_HEIGHT}
      style={{
        width: FIELD_WIDTH * scale,
        height: FIELD_HEIGHT * scale,
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
    />
  );
}

export default memo(GameCanvas);
