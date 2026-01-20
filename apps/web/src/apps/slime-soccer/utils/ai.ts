import type { SlimeState, BallState, InputState, AIDifficulty } from '../types';
import { GAME_CONFIG } from '../types';

const { FIELD_WIDTH, FIELD_HEIGHT, GROUND_HEIGHT, SLIME_RADIUS, BALL_RADIUS } =
  GAME_CONFIG;

// 预测球的落点
function predictBallPosition(
  ball: BallState,
  frames: number
): { x: number; y: number } {
  let x = ball.position.x;
  let y = ball.position.y;
  let vx = ball.velocity.x;
  let vy = ball.velocity.y;
  const groundY = FIELD_HEIGHT - GROUND_HEIGHT - BALL_RADIUS;

  for (let i = 0; i < frames; i++) {
    vy += GAME_CONFIG.BALL_GRAVITY;
    vx *= GAME_CONFIG.BALL_FRICTION;
    x += vx;
    y += vy;

    // 地面反弹
    if (y >= groundY) {
      y = groundY;
      vy *= -GAME_CONFIG.BALL_BOUNCE;
    }

    // 边界反弹
    if (x < BALL_RADIUS) {
      x = BALL_RADIUS;
      vx *= -GAME_CONFIG.BALL_BOUNCE;
    }
    if (x > FIELD_WIDTH - BALL_RADIUS) {
      x = FIELD_WIDTH - BALL_RADIUS;
      vx *= -GAME_CONFIG.BALL_BOUNCE;
    }
  }

  return { x, y };
}

// 简单 AI：基础反应
function getEasyAIInput(
  slime: SlimeState,
  ball: BallState,
  _opponentSlime: SlimeState
): InputState {
  const input: InputState = {
    left: false,
    right: false,
    up: false,
    grab: false,
  };

  // 30% 概率不做任何操作（模拟反应慢）
  if (Math.random() < 0.3) {
    return input;
  }

  const predictedBall = predictBallPosition(ball, 20);
  const isOnMySide =
    slime.side === 'right'
      ? predictedBall.x > FIELD_WIDTH / 2
      : predictedBall.x < FIELD_WIDTH / 2;

  // 只在球在自己半场时才移动
  if (isOnMySide) {
    const targetX = predictedBall.x;
    const dx = targetX - slime.position.x;

    if (dx > SLIME_RADIUS * 0.5) {
      input.right = true;
    } else if (dx < -SLIME_RADIUS * 0.5) {
      input.left = true;
    }

    // 简单跳跃逻辑
    if (
      ball.position.y < slime.position.y - SLIME_RADIUS &&
      Math.abs(dx) < SLIME_RADIUS * 2
    ) {
      if (Math.random() < 0.5) {
        input.up = true;
      }
    }
  } else {
    // 回到默认位置
    const homeX =
      slime.side === 'left' ? FIELD_WIDTH * 0.25 : FIELD_WIDTH * 0.75;
    const dx = homeX - slime.position.x;
    if (dx > SLIME_RADIUS) {
      input.right = true;
    } else if (dx < -SLIME_RADIUS) {
      input.left = true;
    }
  }

  return input;
}

// 中等 AI：有策略意识
function getMediumAIInput(
  slime: SlimeState,
  ball: BallState,
  _opponentSlime: SlimeState
): InputState {
  const input: InputState = {
    left: false,
    right: false,
    up: false,
    grab: false,
  };

  // 15% 反应延迟
  if (Math.random() < 0.15) {
    return input;
  }

  const predictedBall = predictBallPosition(ball, 30);
  const isOnMySide =
    slime.side === 'right'
      ? ball.position.x > FIELD_WIDTH / 2 - 50
      : ball.position.x < FIELD_WIDTH / 2 + 50;

  const goalX = slime.side === 'left' ? 0 : FIELD_WIDTH;
  const isBallNearMyGoal =
    Math.abs(ball.position.x - goalX) < FIELD_WIDTH * 0.3;

  if (isOnMySide || isBallNearMyGoal) {
    // 进攻/防守模式
    let targetX = predictedBall.x;

    // 如果球在头顶，移动到球的下方
    if (ball.position.y < slime.position.y - SLIME_RADIUS) {
      targetX =
        ball.position.x +
        (slime.side === 'left' ? -SLIME_RADIUS * 0.5 : SLIME_RADIUS * 0.5);
    }

    const dx = targetX - slime.position.x;
    if (dx > SLIME_RADIUS * 0.3) {
      input.right = true;
    } else if (dx < -SLIME_RADIUS * 0.3) {
      input.left = true;
    }

    // 智能跳跃
    const distToBall = Math.sqrt(
      Math.pow(ball.position.x - slime.position.x, 2) +
        Math.pow(ball.position.y - slime.position.y, 2)
    );

    if (distToBall < SLIME_RADIUS + BALL_RADIUS + 50) {
      if (ball.position.y < slime.position.y - SLIME_RADIUS * 0.5) {
        input.up = true;
      }
    }

    // 使用抓球
    if (distToBall < SLIME_RADIUS + BALL_RADIUS + 30 && Math.random() < 0.3) {
      input.grab = true;
    }
  } else {
    // 回到防守位置
    const defenseX =
      slime.side === 'left' ? FIELD_WIDTH * 0.2 : FIELD_WIDTH * 0.8;
    const dx = defenseX - slime.position.x;
    if (Math.abs(dx) > SLIME_RADIUS) {
      input.right = dx > 0;
      input.left = dx < 0;
    }
  }

  return input;
}

// 困难 AI：高级策略
function getHardAIInput(
  slime: SlimeState,
  ball: BallState,
  opponentSlime: SlimeState
): InputState {
  const input: InputState = {
    left: false,
    right: false,
    up: false,
    grab: false,
  };

  // 5% 极小的反应延迟
  if (Math.random() < 0.05) {
    return input;
  }

  const predictedBall30 = predictBallPosition(ball, 30);
  const predictedBall60 = predictBallPosition(ball, 60);

  const isBallComingToMe =
    slime.side === 'right' ? ball.velocity.x > 0 : ball.velocity.x < 0;

  const isBallOnMySide =
    slime.side === 'right'
      ? ball.position.x > FIELD_WIDTH / 2 - 100
      : ball.position.x < FIELD_WIDTH / 2 + 100;

  const distToBall = Math.sqrt(
    Math.pow(ball.position.x - slime.position.x, 2) +
      Math.pow(ball.position.y - slime.position.y, 2)
  );

  // 判断是否应该进攻
  const shouldAttack = !isBallComingToMe && distToBall < FIELD_WIDTH * 0.4;

  if (isBallOnMySide || isBallComingToMe) {
    // 防守/拦截模式
    let targetX: number;

    if (ball.position.y < slime.position.y - SLIME_RADIUS) {
      // 球在头顶上方，定位到球的稍微后方以便击球
      targetX =
        ball.position.x +
        (slime.side === 'left' ? -SLIME_RADIUS * 0.3 : SLIME_RADIUS * 0.3);
    } else {
      // 球在下方，预测落点
      targetX = predictedBall30.x;
    }

    // 限制在自己的半场
    const minX = slime.side === 'left' ? SLIME_RADIUS : FIELD_WIDTH / 2;
    const maxX =
      slime.side === 'left' ? FIELD_WIDTH / 2 : FIELD_WIDTH - SLIME_RADIUS;
    targetX = Math.max(minX, Math.min(maxX, targetX));

    const dx = targetX - slime.position.x;
    if (dx > SLIME_RADIUS * 0.2) {
      input.right = true;
    } else if (dx < -SLIME_RADIUS * 0.2) {
      input.left = true;
    }

    // 精确跳跃时机
    if (distToBall < SLIME_RADIUS + BALL_RADIUS + 60) {
      const ballWillBeAbove =
        predictBallPosition(ball, 10).y < slime.position.y;
      if (
        ballWillBeAbove ||
        ball.position.y < slime.position.y - SLIME_RADIUS * 0.3
      ) {
        input.up = true;
      }
    }

    // 智能使用抓球
    if (distToBall < SLIME_RADIUS + BALL_RADIUS + 40) {
      // 如果球朝对方球门方向，使用抓球加速
      const ballGoingToOpponent =
        slime.side === 'left' ? ball.velocity.x > 0 : ball.velocity.x < 0;
      if (ballGoingToOpponent || Math.random() < 0.4) {
        input.grab = true;
      }
    }
  } else if (shouldAttack) {
    // 进攻模式：追球
    const targetX = predictedBall60.x;
    const dx = targetX - slime.position.x;

    // 更激进的移动
    if (dx > SLIME_RADIUS * 0.1) {
      input.right = true;
    } else if (dx < -SLIME_RADIUS * 0.1) {
      input.left = true;
    }

    // 进攻时更频繁跳跃
    if (distToBall < SLIME_RADIUS + BALL_RADIUS + 80) {
      input.up = true;
      input.grab = true;
    }
  } else {
    // 智能防守站位
    // 根据对手位置调整
    const opponentX = opponentSlime.position.x;
    const ballDistToOpponent = Math.abs(ball.position.x - opponentX);

    let defenseX: number;
    if (ballDistToOpponent < SLIME_RADIUS * 3) {
      // 对手可能要击球，靠前一点
      defenseX =
        slime.side === 'left' ? FIELD_WIDTH * 0.35 : FIELD_WIDTH * 0.65;
    } else {
      // 保守防守
      defenseX = slime.side === 'left' ? FIELD_WIDTH * 0.2 : FIELD_WIDTH * 0.8;
    }

    const dx = defenseX - slime.position.x;
    if (Math.abs(dx) > SLIME_RADIUS * 0.5) {
      input.right = dx > 0;
      input.left = dx < 0;
    }
  }

  return input;
}

// 获取 AI 输入
export function getAIInput(
  slime: SlimeState,
  ball: BallState,
  opponentSlime: SlimeState,
  difficulty: AIDifficulty
): InputState {
  switch (difficulty) {
    case 'easy':
      return getEasyAIInput(slime, ball, opponentSlime);
    case 'medium':
      return getMediumAIInput(slime, ball, opponentSlime);
    case 'hard':
      return getHardAIInput(slime, ball, opponentSlime);
    default:
      return { left: false, right: false, up: false, grab: false };
  }
}
