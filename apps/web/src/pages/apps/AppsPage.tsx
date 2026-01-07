import { Link } from 'react-router-dom';
import { appRegistry } from '../../apps';
import * as Icons from 'lucide-react';
import { cn } from '../../lib/utils';

type IconName = keyof typeof Icons;

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
  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">应用中心</h1>
        <p className="mt-2 text-muted-foreground">一些有趣的小工具和应用</p>
      </div>

      {/* App Grid */}
      {appRegistry.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {appRegistry.map(app => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icons.Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">暂无应用</p>
        </div>
      )}
    </div>
  );
}
