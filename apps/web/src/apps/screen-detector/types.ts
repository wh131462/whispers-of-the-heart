import type { ReactNode } from 'react';

export type PanelCategory =
  | 'intro'
  | 'pure-color'
  | 'line'
  | 'pattern'
  | 'contrast'
  | 'gradient'
  | 'saturation'
  | 'info'
  | 'touch'
  | 'end';

export type DetectorPanel = {
  id: string;
  category: PanelCategory;
  name: string;
  description: string;
  render: () => ReactNode;
};

export type PanelGroup = {
  category: PanelCategory;
  title: string;
  panels: DetectorPanel[];
};
