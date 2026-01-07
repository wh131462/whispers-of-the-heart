import type { LazyExoticComponent, ComponentType } from 'react';

export type AppMeta = {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  cover?: string;
  tags?: string[];
  component: LazyExoticComponent<ComponentType>;
};
