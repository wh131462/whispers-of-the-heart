import { Suspense, useState, useCallback, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2, Info } from 'lucide-react';
import { getAppById } from '../../apps';
import { Button } from '../../components/ui/button';

function AppLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  );
}

export default function AppDetailPage() {
  const { appId } = useParams<{ appId: string }>();
  const app = appId ? getAppById(appId) : undefined;
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // ESC 键退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!app) {
    return <Navigate to="/apps" replace />;
  }

  const AppComponent = app.component;

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 w-screen h-screen z-50 bg-white overflow-auto flex items-center justify-center">
        {/* App Content - 全屏 */}
        <div className="size-full">
          <Suspense fallback={<AppLoader />}>
            <AppComponent />
          </Suspense>
        </div>

        {/* 右上角退出按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 right-4 z-50 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
          onClick={toggleFullscreen}
          title="退出全屏 (ESC)"
        >
          <Minimize2 className="h-4 w-4" />
        </Button>

        {/* 右下角工具信息 */}
        <div className="group fixed bottom-4 right-4 z-50 flex items-center gap-1.5 text-zinc-300 text-xs">
          <span>{app.name}</span>
          <div className="relative">
            <Info className="h-3.5 w-3.5 cursor-help" />
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-zinc-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {app.description}
              <div className="absolute top-full right-2 border-4 border-transparent border-t-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link to="/apps">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground">{app.name}</h1>
          <p className="text-sm text-muted-foreground">{app.description}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={toggleFullscreen}
          title="全屏"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* App Content */}
      <div className="rounded-xl border bg-card">
        <Suspense fallback={<AppLoader />}>
          <AppComponent />
        </Suspense>
      </div>
    </div>
  );
}
