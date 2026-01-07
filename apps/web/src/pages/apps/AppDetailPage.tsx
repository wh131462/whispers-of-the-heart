import { Suspense } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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

  if (!app) {
    return <Navigate to="/apps" replace />;
  }

  const AppComponent = app.component;

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link to="/apps">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{app.name}</h1>
          <p className="text-sm text-muted-foreground">{app.description}</p>
        </div>
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
