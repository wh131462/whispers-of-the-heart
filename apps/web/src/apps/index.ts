import { lazy } from 'react';
import type { AppMeta } from './types';

export type { AppMeta };

export const appRegistry: AppMeta[] = [
  {
    id: 'keyboard-tester',
    name: '键盘检测器',
    description: '检测键盘所有按键是否正常工作，支持实时显示按键信息',
    icon: 'Keyboard',
    tags: ['工具', '硬件'],
    component: lazy(() => import('./keyboard-tester')),
  },
  {
    id: 'calculator',
    name: '计算器',
    description: '多功能计算器，支持标准、科学、程序员三种模式',
    icon: 'Calculator',
    tags: ['工具', '计算'],
    component: lazy(() => import('./calculator')),
  },
];

export function getAppById(id: string): AppMeta | undefined {
  return appRegistry.find(app => app.id === id);
}
