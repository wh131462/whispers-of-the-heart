import { lazy } from 'react';
import type { AppMeta } from './types';

export type { AppMeta };

// 应用分类
export type AppCategory = '全部' | '开发' | '实用' | '设计' | '娱乐';

export const APP_CATEGORIES: AppCategory[] = [
  '全部',
  '开发',
  '实用',
  '设计',
  '娱乐',
];

export const appRegistry: AppMeta[] = [
  // 实用工具
  {
    id: 'keyboard-tester',
    name: '键盘检测器',
    description: '检测键盘所有按键是否正常工作，支持实时显示按键信息',
    icon: 'Keyboard',
    tags: ['实用'],
    component: lazy(() => import('./keyboard-tester')),
  },
  {
    id: 'calculator',
    name: '计算器',
    description: '多功能计算器，支持标准、科学、程序员三种模式',
    icon: 'Calculator',
    tags: ['实用'],
    component: lazy(() => import('./calculator')),
  },
  {
    id: 'unit-converter',
    name: '单位转换器',
    description: '支持长度、重量、温度、面积、体积、速度、时间、数据等单位转换',
    icon: 'ArrowLeftRight',
    tags: ['实用'],
    component: lazy(() => import('./unit-converter')),
  },
  {
    id: 'timer',
    name: '计时器',
    description: '秒表、倒计时、番茄钟三合一，支持分圈记录',
    icon: 'Timer',
    tags: ['实用'],
    component: lazy(() => import('./timer')),
  },
  {
    id: 'password-generator',
    name: '密码生成器',
    description: '生成安全密码，支持自定义长度和字符类型',
    icon: 'KeyRound',
    tags: ['实用'],
    component: lazy(() => import('./password-generator')),
  },
  // 开发工具
  {
    id: 'json-formatter',
    name: 'JSON格式化',
    description: 'JSON美化、压缩、校验，支持树形视图',
    icon: 'Braces',
    tags: ['开发'],
    component: lazy(() => import('./json-formatter')),
  },
  {
    id: 'base64-codec',
    name: 'Base64编解码',
    description: '文本和文件的Base64编码解码，支持图片预览',
    icon: 'Binary',
    tags: ['开发'],
    component: lazy(() => import('./base64-codec')),
  },
  {
    id: 'regex-tester',
    name: '正则测试器',
    description: '正则表达式实时匹配测试，支持高亮显示和常用模式',
    icon: 'Regex',
    tags: ['开发'],
    component: lazy(() => import('./regex-tester')),
  },
  {
    id: 'timestamp-converter',
    name: '时间戳转换',
    description: 'Unix时间戳与日期时间互转，支持多时区和格式',
    icon: 'Clock',
    tags: ['开发'],
    component: lazy(() => import('./timestamp-converter')),
  },
  // 设计工具
  {
    id: 'color-palette',
    name: '调色板',
    description: '颜色选择、格式转换、配色方案、对比度检查',
    icon: 'Palette',
    tags: ['设计'],
    component: lazy(() => import('./color-palette')),
  },
  // 娱乐
  {
    id: 'minesweeper',
    name: '扫雷',
    description: '经典扫雷游戏，支持初级、中级、高级三种难度',
    icon: 'Bomb',
    tags: ['娱乐'],
    component: lazy(() => import('./minesweeper')),
  },
  {
    id: 'game-2048',
    name: '2048',
    description: '经典数字益智游戏，滑动合并相同数字达到2048',
    icon: 'Grid3X3',
    tags: ['娱乐'],
    component: lazy(() => import('./game-2048')),
  },
  {
    id: 'snake',
    name: '贪吃蛇',
    description: '经典贪吃蛇游戏，控制蛇吃食物不断变长',
    icon: 'Gamepad2',
    tags: ['娱乐'],
    component: lazy(() => import('./snake')),
  },
  {
    id: 'tetris',
    name: '俄罗斯方块',
    description: '经典方块消除游戏，堆叠方块消除得分',
    icon: 'Blocks',
    tags: ['娱乐'],
    component: lazy(() => import('./tetris')),
  },
  {
    id: 'sudoku',
    name: '数独',
    description: '经典数字逻辑游戏，填满9x9格子使每行列宫不重复',
    icon: 'LayoutGrid',
    tags: ['娱乐'],
    component: lazy(() => import('./sudoku')),
  },
  {
    id: 'reversi',
    name: '黑白棋',
    description: '经典翻转棋，通过翻转对方棋子占领更多格子',
    icon: 'Circle',
    tags: ['娱乐'],
    component: lazy(() => import('./reversi')),
  },
  {
    id: 'gomoku',
    name: '五子棋',
    description: '经典棋类游戏，五子连珠先连成一线获胜',
    icon: 'CircleDot',
    tags: ['娱乐'],
    component: lazy(() => import('./gomoku')),
  },
];

export function getAppById(id: string): AppMeta | undefined {
  return appRegistry.find(app => app.id === id);
}
