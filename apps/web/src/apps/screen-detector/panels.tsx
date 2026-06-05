import type { PanelGroup } from './types';
import { PureColorPanel } from './panels/PureColorPanel';
import { LinePanel } from './panels/LinePanel';
import { DotsPanel } from './panels/DotsPanel';
import { MicroPatternPanel } from './panels/MicroPatternPanel';
import { FlashSquarePanel } from './panels/FlashSquarePanel';
import { SquareGridPanel } from './panels/SquareGridPanel';
import { ColorGridPanel } from './panels/ColorGridPanel';
import { ContrastPanel } from './panels/ContrastPanel';
import { GradientPanel } from './panels/GradientPanel';
import { SaturationPanel } from './panels/SaturationPanel';
import { ScreenInfoPanel } from './panels/ScreenInfoPanel';
import { MultiTouchPanel } from './panels/MultiTouchPanel';
import { WelcomePanel } from './panels/WelcomePanel';
import { EndPanel } from './panels/EndPanel';

type BuildArgs = {
  goToWelcome: () => void;
};

export function buildPanelGroups({ goToWelcome }: BuildArgs): PanelGroup[] {
  return [
    {
      category: 'intro',
      title: '介绍',
      panels: [
        {
          id: 'welcome',
          category: 'intro',
          name: '欢迎页',
          description: '项目介绍与分辨率信息',
          render: () => <WelcomePanel />,
        },
      ],
    },
    {
      category: 'pure-color',
      title: '纯色（坏点 / 漏光）',
      panels: [
        {
          id: 'pure-red',
          category: 'pure-color',
          name: '纯红色',
          description: '用于检测红色子像素坏点 #ff0000',
          render: () => <PureColorPanel color="#ff0000" />,
        },
        {
          id: 'pure-green',
          category: 'pure-color',
          name: '纯绿色',
          description: '用于检测绿色子像素坏点 #00ff00',
          render: () => <PureColorPanel color="#00ff00" />,
        },
        {
          id: 'pure-blue',
          category: 'pure-color',
          name: '纯蓝色',
          description: '用于检测蓝色子像素坏点 #0000ff',
          render: () => <PureColorPanel color="#0000ff" />,
        },
        {
          id: 'pure-yellow',
          category: 'pure-color',
          name: '纯黄色',
          description: '用于检测红绿组合 #ffff00',
          render: () => <PureColorPanel color="#ffff00" />,
        },
        {
          id: 'pure-cyan',
          category: 'pure-color',
          name: '纯青色',
          description: '用于检测绿蓝组合 #00ffff',
          render: () => <PureColorPanel color="#00ffff" />,
        },
        {
          id: 'pure-magenta',
          category: 'pure-color',
          name: '纯洋红色',
          description: '用于检测红蓝组合 #ff00ff',
          render: () => <PureColorPanel color="#ff00ff" />,
        },
        {
          id: 'pure-white',
          category: 'pure-color',
          name: '纯白色',
          description: '用于检测暗点坏点 #ffffff',
          render: () => <PureColorPanel color="#ffffff" />,
        },
        {
          id: 'pure-black',
          category: 'pure-color',
          name: '纯黑色',
          description: '用于检测亮点与漏光 #000000',
          render: () => <PureColorPanel color="#000000" />,
        },
      ],
    },
    {
      category: 'line',
      title: '线条干扰',
      panels: [
        {
          id: 'line-h1',
          category: 'line',
          name: '水平线 1',
          description: '1px 黑白横线交替',
          render: () => <LinePanel direction="horizontal" step={1} />,
        },
        {
          id: 'line-h2',
          category: 'line',
          name: '水平线 2',
          description: '2px 黑白横线交替',
          render: () => <LinePanel direction="horizontal" step={2} />,
        },
        {
          id: 'line-v1',
          category: 'line',
          name: '垂直线 1',
          description: '1px 黑白竖线交替',
          render: () => <LinePanel direction="vertical" step={1} />,
        },
        {
          id: 'line-v2',
          category: 'line',
          name: '垂直线 2',
          description: '2px 黑白竖线交替',
          render: () => <LinePanel direction="vertical" step={2} />,
        },
        {
          id: 'line-d1',
          category: 'line',
          name: '正斜线 1',
          description: '细对角线 / 像素对齐',
          render: () => <LinePanel direction="diagonal" step={1} />,
        },
        {
          id: 'line-d2',
          category: 'line',
          name: '正斜线 2',
          description: '粗对角线 / 摩尔纹',
          render: () => <LinePanel direction="diagonal" step={2} />,
        },
      ],
    },
    {
      category: 'pattern',
      title: '干扰图案',
      panels: [
        {
          id: 'pattern-dots',
          category: 'pattern',
          name: '点阵',
          description: '1px 白点阵 / 子像素一致性',
          render: () => <DotsPanel />,
        },
        {
          id: 'pattern-micro',
          category: 'pattern',
          name: '微型图案',
          description: '四角 + 中心微型棋盘 / 对焦',
          render: () => <MicroPatternPanel />,
        },
        {
          id: 'pattern-flash',
          category: 'pattern',
          name: '闪烁方块',
          description: '~2Hz 黑白闪烁 / 呼吸效应',
          render: () => <FlashSquarePanel />,
        },
        {
          id: 'pattern-grid-square',
          category: 'pattern',
          name: '方形网格',
          description: '100px 黑白棋盘 / 边缘锐度',
          render: () => <SquareGridPanel />,
        },
        {
          id: 'pattern-grid-color',
          category: 'pattern',
          name: '彩色网格',
          description: '彩色方块循环 / 色块边缘',
          render: () => <ColorGridPanel />,
        },
      ],
    },
    {
      category: 'contrast',
      title: '对比度（色阶）',
      panels: [
        {
          id: 'contrast-dark',
          category: 'contrast',
          name: '对比度（暗）',
          description: '低灰度区分能力 0-40',
          render: () => <ContrastPanel variant="dark" />,
        },
        {
          id: 'contrast-light',
          category: 'contrast',
          name: '对比度（亮）',
          description: '高灰度区分能力 175-254',
          render: () => <ContrastPanel variant="light" />,
        },
      ],
    },
    {
      category: 'gradient',
      title: '渐变',
      panels: [
        {
          id: 'gradient-white',
          category: 'gradient',
          name: '白色渐变',
          description: '黑 → 白 256 级灰阶',
          render: () => <GradientPanel to="#ffffff" />,
        },
        {
          id: 'gradient-red',
          category: 'gradient',
          name: '红色渐变',
          description: '黑 → 红 256 级',
          render: () => <GradientPanel to="#ff0000" />,
        },
        {
          id: 'gradient-green',
          category: 'gradient',
          name: '绿色渐变',
          description: '黑 → 绿 256 级',
          render: () => <GradientPanel to="#00ff00" />,
        },
        {
          id: 'gradient-blue',
          category: 'gradient',
          name: '蓝色渐变',
          description: '黑 → 蓝 256 级',
          render: () => <GradientPanel to="#0000ff" />,
        },
      ],
    },
    {
      category: 'saturation',
      title: '饱和度',
      panels: [
        {
          id: 'saturation',
          category: 'saturation',
          name: '饱和度',
          description: 'HSL 色相条 / 色彩过渡平滑度',
          render: () => <SaturationPanel />,
        },
      ],
    },
    {
      category: 'info',
      title: '现代屏幕信息',
      panels: [
        {
          id: 'screen-info',
          category: 'info',
          name: '屏幕信息',
          description: '分辨率 / DPR / 色域 / HDR / 刷新率',
          render: () => <ScreenInfoPanel />,
        },
        {
          id: 'multi-touch',
          category: 'touch',
          name: '多点触控',
          description: 'pointer 事件追踪 / 轨迹绘制',
          render: () => <MultiTouchPanel />,
        },
      ],
    },
    {
      category: 'end',
      title: '结束',
      panels: [
        {
          id: 'end',
          category: 'end',
          name: '测试结束',
          description: '完成检测，返回欢迎页',
          render: () => <EndPanel onRestart={goToWelcome} />,
        },
      ],
    },
  ];
}

export function flattenPanels(groups: PanelGroup[]) {
  return groups.flatMap(g => g.panels);
}
