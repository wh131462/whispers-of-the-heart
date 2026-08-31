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
    <div className="mx-auto min-h-[calc(100vh-13rem)] max-w-6xl pb-10">
      <header className="max-w-3xl py-8 sm:py-12">
        <p className="mb-3 font-mono text-xs tracking-[0.2em] text-primary">
          PROJECT SHOWCASE
        </p>
        <h1 className="text-balance font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          我做过的一些作品
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
          这里收录开源项目、独立
          APP、网站和站内工具。每个作品都指向可以继续了解、体验或下载的地方。
        </p>
      </header>

      {!loading && !error && projects.length > 0 && (
        <nav
          aria-label="作品类型筛选"
          className="mb-8 flex gap-2 overflow-x-auto pb-2"
        >
          {(['ALL', ...SHOWCASE_PROJECT_TYPES] as ProjectFilter[]).map(type => {
            const active = filter === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilter(type)}
                className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
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
              className={`animate-pulse rounded-2xl bg-muted ${
                item === 0 ? 'h-[30rem] md:col-span-2' : 'h-72'
              }`}
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
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
        <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
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
          {filteredProjects.map((project, index) => (
            <div
              key={project.id}
              className={index === 0 ? 'md:col-span-2' : undefined}
            >
              <ProjectShowcaseCard
                project={project}
                variant={index === 0 ? 'featured' : 'standard'}
              />
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
