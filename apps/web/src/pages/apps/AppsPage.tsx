import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appRegistry, APP_CATEGORIES, type AppCategory } from '../../apps';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

type IconName = keyof typeof Icons;

function CategoryTabs({
  activeCategory,
  onCategoryChange,
}: {
  activeCategory: AppCategory;
  onCategoryChange: (category: AppCategory) => void;
}) {
  // 计算每个分类的应用数量
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 全部: appRegistry.length };
    appRegistry.forEach(app => {
      app.tags?.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, []);

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {APP_CATEGORIES.map(category => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
            activeCategory === category
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          )}
        >
          {category}
          <span
            className={cn(
              'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
              activeCategory === category
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-background text-muted-foreground'
            )}
          >
            {categoryCounts[category] || 0}
          </span>
        </button>
      ))}
    </div>
  );
}

function AppCard({ app }: { app: (typeof appRegistry)[0] }) {
  const IconComponent = Icons[app.icon as IconName] as Icons.LucideIcon;

  return (
    <Link to={`/apps/${app.id}`} className="group block">
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border bg-card p-6',
          'transition-all duration-300 ease-out',
          'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5',
          'hover:-translate-y-1'
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            'mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg',
            'bg-primary/10 text-primary',
            'transition-transform duration-300 group-hover:scale-110'
          )}
        >
          {IconComponent && <IconComponent className="h-6 w-6" />}
        </div>

        {/* Content */}
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {app.name}
        </h3>
        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
          {app.description}
        </p>

        {/* Tags */}
        {app.tags && app.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {app.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Hover indicator */}
        <div
          className={cn(
            'absolute bottom-0 left-0 h-1 w-0 bg-primary',
            'transition-all duration-300 group-hover:w-full'
          )}
        />
      </div>
    </Link>
  );
}

export default function AppsPage() {
  const [activeCategory, setActiveCategory] = useState<AppCategory>('全部');
  const [columnCount, setColumnCount] = useState(3);

  // 根据视口宽度切换列数：<640 -> 1，<1024 -> 2，否则 3
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < 640) setColumnCount(1);
      else if (w < 1024) setColumnCount(2);
      else setColumnCount(3);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  // 根据分类筛选应用
  const filteredApps = useMemo(() => {
    if (activeCategory === '全部') {
      return appRegistry;
    }
    return appRegistry.filter(app => app.tags?.includes(activeCategory));
  }, [activeCategory]);

  // 轮询分配到各列：保证视觉上 从左到右、再换行
  const columns = useMemo(() => {
    const cols: (typeof filteredApps)[] = Array.from(
      { length: columnCount },
      () => []
    );
    filteredApps.forEach((app, i) => {
      cols[i % columnCount].push(app);
    });
    return cols;
  }, [filteredApps, columnCount]);

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">应用中心</h1>
        <p className="mt-2 text-muted-foreground">一些有趣的小工具和应用</p>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* App Masonry */}
      {filteredApps.length > 0 ? (
        <div className="flex gap-6 items-start">
          {columns.map((colApps, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-6 min-w-0">
              {colApps.map(app => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icons.Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">该分类暂无应用</p>
        </div>
      )}
    </div>
  );
}
