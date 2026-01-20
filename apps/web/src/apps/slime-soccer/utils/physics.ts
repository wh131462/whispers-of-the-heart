import type {
  Vector2D,
  SlimeState,
  BallState,
  InputState,
  PlayerSide,
} from '../types';
import { GAME_CONFIG } from '../types';

const {
  FIELD_WIDTH,
  FIELD_HEIGHT,
  GROUND_HEIGHT,
  SLIME_RADIUS,
  SLIME_SPEED,
  SLIME_JUMP_FORCE,
  SLIME_GRAVITY,
  SLIME_BOUNCE,
  BALL_RADIUS,
  BALL_GRAVITY,
  BALL_BOUNCE,
  BALL_FRICTION,
  BALL_ANGULAR_FRICTION,
  GOAL_WIDTH,
  GOAL_HEIGHT,
} = GAME_CONFIG;

// 向量运算
export function addVec(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subVec(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scaleVec(v: Vector2D, s: number): Vector2D {
  return { x: v.x * s, y: v.y * s };
}

export function lengthVec(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalizeVec(v: Vector2D): Vector2D {
  const len = lengthVec(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function dotVec(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}

// 更新史莱姆状态
export function updateSlime(
  slime: SlimeState,
  input: InputState,
  _deltaTime: number
): SlimeState {
  const newSlime = { ...slime };
  const groundY = FIELD_HEIGHT - GROUND_HEIGHT; // 半圆底部在地面上

  // 水平移动
  if (input.left && !input.right) {
    newSlime.velocity.x = -SLIME_SPEED;
  } else if (input.right && !input.left) {
    newSlime.velocity.x = SLIME_SPEED;
  } else {
    newSlime.velocity.x = 0;
  }

  // 跳跃
  if (input.up && !newSlime.isJumping) {
    newSlime.velocity.y = -SLIME_JUMP_FORCE;
    newSlime.isJumping = true;
  }

  // 抓球状态
  newSlime.isGrabbing = input.grab;

  // 重力
  newSlime.velocity.y += SLIME_GRAVITY;

  // 更新位置
  newSlime.position.x += newSlime.velocity.x;
  newSlime.position.y += newSlime.velocity.y;

  // 地面碰撞
  if (newSlime.position.y >= groundY) {
    newSlime.position.y = groundY;
    newSlime.velocity.y = 0;
    newSlime.isJumping = false;
  }

  // 边界碰撞
  const leftBound = slime.side === 'left' ? SLIME_RADIUS : FIELD_WIDTH / 2;
  const rightBound =
    slime.side === 'left' ? FIELD_WIDTH / 2 : FIELD_WIDTH - SLIME_RADIUS;

  if (newSlime.position.x < leftBound) {
    newSlime.position.x = leftBound;
    newSlime.velocity.x *= -SLIME_BOUNCE;
  }
  if (newSlime.position.x > rightBound) {
    newSlime.position.x = rightBound;
    newSlime.velocity.x *= -SLIME_BOUNCE;
  }

  // 天花板碰撞
  if (newSlime.position.y < SLIME_RADIUS) {
    newSlime.position.y = SLIME_RADIUS;
    newSlime.velocity.y *= -SLIME_BOUNCE;
  }

  return newSlime;
}

// 更新球状态
export function updateBall(ball: BallState, _deltaTime: number): BallState {
  const newBall = { ...ball };
  const groundY = FIELD_HEIGHT - GROUND_HEIGHT - BALL_RADIUS;

  // 如果被抓住，不更新物理
  if (newBall.isGrabbed) {
    return newBall;
  }

  // 重力
  newBall.velocity.y += BALL_GRAVITY;

  // 空气阻力
  newBall.velocity.x *= BALL_FRICTION;
  newBall.angularVelocity *= BALL_ANGULAR_FRICTION;

  // 更新位置和旋转
  newBall.position.x += newBall.velocity.x;
  newBall.position.y += newBall.velocity.y;
  newBall.rotation += newBall.angularVelocity;

  // 地面碰撞
  if (newBall.position.y >= groundY) {
    newBall.position.y = groundY;
    newBall.velocity.y *= -BALL_BOUNCE;
    // 地面摩擦影响旋转
    newBall.angularVelocity += newBall.velocity.x * 0.05;
  }

  // 边界碰撞（考虑球门）
  const goalTop = FIELD_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT;
  const inGoalHeight = newBall.position.y > goalTop;

  // 左边界
  if (newBall.position.x < BALL_RADIUS) {
    // 如果在球门高度范围内且在球门宽度内，允许进入
    if (inGoalHeight && newBall.position.x > -BALL_RADIUS) {
      // 球在球门区域，不反弹
    } else {
      newBall.position.x = BALL_RADIUS;
      newBall.velocity.x *= -BALL_BOUNCE;
      newBall.angularVelocity = -newBall.velocity.y * 0.1;
    }
  }

  // 右边界
  if (newBall.position.x > FIELD_WIDTH - BALL_RADIUS) {
    // 如果在球门高度范围内且在球门宽度内，允许进入
    if (inGoalHeight && newBall.position.x < FIELD_WIDTH + BALL_RADIUS) {
      // 球在球门区域，不反弹
    } else {
      newBall.position.x = FIELD_WIDTH - BALL_RADIUS;
      newBall.velocity.x *= -BALL_BOUNCE;
      newBall.angularVelocity = newBall.velocity.y * 0.1;
    }
  }

  // 球门柱碰撞检测
  const goalPostX_left = GOAL_WIDTH;
  const goalPostX_right = FIELD_WIDTH - GOAL_WIDTH;

  // 左球门柱
  if (
    newBall.position.x < goalPostX_left + BALL_RADIUS &&
    newBall.position.y < goalTop + BALL_RADIUS &&
    newBall.position.y > goalTop - BALL_RADIUS
  ) {
    if (newBall.velocity.x < 0) {
      newBall.position.x = goalPostX_left + BALL_RADIUS;
      newBall.velocity.x *= -BALL_BOUNCE;
    }
  }

  // 右球门柱
  if (
    newBall.position.x > goalPostX_right - BALL_RADIUS &&
    newBall.position.y < goalTop + BALL_RADIUS &&
    newBall.position.y > goalTop - BALL_RADIUS
  ) {
    if (newBall.velocity.x > 0) {
      newBall.position.x = goalPostX_right - BALL_RADIUS;
      newBall.velocity.x *= -BALL_BOUNCE;
    }
  }

  // 天花板碰撞
  if (newBall.position.y < BALL_RADIUS) {
    newBall.position.y = BALL_RADIUS;
    newBall.velocity.y *= -BALL_BOUNCE;
  }

  return newBall;
}

// 检测史莱姆和球的碰撞
export function checkSlimeBallCollision(
  slime: SlimeState,
  ball: BallState
): BallState | null {
  const dx = ball.position.x - slime.position.x;
  const dy = ball.position.y - slime.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDist = SLIME_RADIUS + BALL_RADIUS;

  // 只检测上半圆（史莱姆是半圆形）
  if (distance < minDist && dy < 0) {
    const newBall = { ...ball };

    // 计算碰撞法线
    const nx = dx / distance;
    const ny = dy / distance;

    // 分离球和史莱姆
    const overlap = minDist - distance;
    newBall.position.x += nx * overlap;
    newBall.position.y += ny * overlap;

    // 计算相对速度
    const relVelX = ball.velocity.x - slime.velocity.x;
    const relVelY = ball.velocity.y - slime.velocity.y;

    // 计算反弹速度
    const dotProduct = relVelX * nx + relVelY * ny;

    if (dotProduct < 0) {
      const bounceForce = 1.5;
      newBall.velocity.x = relVelX - 2 * dotProduct * nx * bounceForce;
      newBall.velocity.y = relVelY - 2 * dotProduct * ny * bounceForce;

      // 添加史莱姆的速度影响
      newBall.velocity.x += slime.velocity.x * 0.5;
      newBall.velocity.y += slime.velocity.y * 0.5;

      // 抓球时额外加速
      if (slime.isGrabbing) {
        const grabBoost = 1.3;
        newBall.velocity.x *= grabBoost;
        newBall.velocity.y *= grabBoost;
      }

      // 旋转效果
      newBall.angularVelocity += (slime.velocity.x - newBall.velocity.x) * 0.1;
    }

    return newBall;
  }

  return null;
}

// 检测进球
export function checkGoal(ball: BallState): PlayerSide | null {
  const goalTop = FIELD_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT;

  // 左边球门（右方得分）- 球心进入球门区域
  if (ball.position.x < BALL_RADIUS && ball.position.y > goalTop) {
    return 'right';
  }

  // 右边球门（左方得分）- 球心进入球门区域
  if (
    ball.position.x > FIELD_WIDTH - BALL_RADIUS &&
    ball.position.y > goalTop
  ) {
    return 'left';
  }

  return null;
}

// 重置球到中场
export function resetBallToCenter(): BallState {
  return {
    position: {
      x: FIELD_WIDTH / 2,
      y: FIELD_HEIGHT / 3,
    },
    velocity: { x: 0, y: 0 },
    angularVelocity: 0,
    rotation: 0,
    isGrabbed: false,
    grabbedBy: null,
  };
}

// 重置史莱姆到初始位置
export function resetSlime(
  side: PlayerSide,
  currentSlime: SlimeState
): SlimeState {
  return {
    ...currentSlime,
    position: {
      x: side === 'left' ? FIELD_WIDTH * 0.25 : FIELD_WIDTH * 0.75,
      y: FIELD_HEIGHT - GROUND_HEIGHT, // 半圆底部在地面上
    },
    velocity: { x: 0, y: 0 },
    isJumping: false,
    isGrabbing: false,
    grabAngle: 0,
    campingTime: 0,
  };
}
