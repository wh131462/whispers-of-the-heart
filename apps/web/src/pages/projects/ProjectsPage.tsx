import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Boxes, Loader2, RefreshCw } from 'lucide-react';

import { api } from '@whispers/utils';

import ProjectShowcaseCard from '../../components/project-showcase/ProjectShowcaseCard';
import { Button } from '../../components/ui/button';
import {
  SHOWCASE_PROJECT_TYPE_LABELS,
  SHOWCASE_PROJECT_TYPES,
  type ApiEnvelope,
  type ShowcaseProject,
  type ShowcaseProjectType,
} from '../../types/project-showcase';

type ProjectFilter = 'ALL' | ShowcaseProjectType;

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ShowcaseProject[]>([]);
  const [filter, setFilter] = useState<ProjectFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response =
        await api.get<ApiEnvelope<ShowcaseProject[]>>('/projects');
      setProjects(response.data.data);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error ? requestError.message : '作品加载失败'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(
    () =>
      filter === 'ALL'
        ? projects
        : projects.filter(project => project.type === filter),
    [filter, projects]
  );

  const counts = useMemo(() => {
    const result: Record<ProjectFilter, number> = {
      ALL: projects.length,
      OPEN_SOURCE: 0,
      APP: 0,
      WEBSITE: 0,
      SITE_TOOL: 0,
    };
    projects.forEach(project => {
      result[project.type] += 1;
    });
    return result;
  }, [projects]);

  return (
    <div className="relative mx-auto min-h-[calc(100vh-13rem)] max-w-6xl pb-16">
      <div className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <header className="relative flex flex-col gap-8 border-b border-border/70 py-10 sm:py-16 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-4 font-mono text-[11px] font-semibold tracking-[0.24em] text-primary">
            SELECTED WORKS / 作品集
          </p>
          <h1 className="text-balance font-serif text-4xl font-bold tracking-[-0.04em] text-foreground sm:text-6xl">
            把想法做成
            <br className="hidden sm:block" />
            可以使用的东西
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            开源项目、独立应用和一些解决日常问题的小工具。每一项都可以继续了解、体验或下载。
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
            {projects.length.toString().padStart(2, '0')}
          </span>
          <span className="max-w-20 leading-5">项公开作品</span>
        </div>
      </header>

      {!loading && !error && projects.length > 0 && (
        <nav
          aria-label="作品类型筛选"
          className="mb-10 flex gap-2 overflow-x-auto py-1"
        >
          {(['ALL', ...SHOWCASE_PROJECT_TYPES] as ProjectFilter[]).map(type => {
            const active = filter === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilter(type)}
                className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-[color,background-color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none ${
                  active
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-card/60 text-muted-foreground ring-1 ring-border/70 hover:bg-muted hover:text-foreground'
                }`}
              >
                {type === 'ALL'
                  ? '全部作品'
                  : SHOWCASE_PROJECT_TYPE_LABELS[type]}
                <span className="ml-2 font-mono text-xs opacity-70">
                  {counts[type]}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1, 2].map(item => (
            <div
              key={item}
              className={`animate-pulse rounded-lg bg-muted ${
                item === 0 ? 'h-[30rem] md:col-span-2' : 'h-72'
              }`}
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-16 text-center shadow-[0_8px_24px_-18px_hsl(var(--foreground)/0.3)] dark:shadow-[0_8px_24px_-18px_hsl(var(--background)/0.75)]">
          <RefreshCw className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            暂时无法加载作品
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-5" onClick={() => void fetchProjects()}>
            重新加载
          </Button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-16 text-center shadow-[0_8px_24px_-18px_hsl(var(--foreground)/0.3)] dark:shadow-[0_8px_24px_-18px_hsl(var(--background)/0.75)]">
          <Boxes className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            {projects.length === 0 ? '作品正在整理中' : '这个分类还没有作品'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {projects.length === 0
              ? '完成整理并上线后，作品会出现在这里。'
              : '可以切换到其他分类继续浏览。'}
          </p>
        </div>
      ) : (
        <div className="grid items-stretch gap-5 md:grid-cols-2">
          {filteredProjects.map(project => (
            <div key={project.id}>
              <ProjectShowcaseCard project={project} variant="standard" />
            </div>
          ))}
        </div>
      )}

      {loading && (
        <span className="sr-only">
          <Loader2 className="animate-spin" />
          正在加载作品
        </span>
      )}
    </div>
  );
};

export default ProjectsPage;
