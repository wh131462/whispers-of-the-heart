import React, { useState } from 'react';

import {
  Code2,
  Download,
  ExternalLink,
  Globe2,
  Smartphone,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import { getMediaUrl } from '@whispers/utils';

import {
  SHOWCASE_PROJECT_TYPE_LABELS,
  type ShowcaseProject,
  type ShowcaseProjectType,
} from '../../types/project-showcase';

interface ProjectShowcaseCardProps {
  project: ShowcaseProject;
  variant?: 'standard' | 'featured' | 'compact';
}

const TYPE_ICONS: Record<ShowcaseProjectType, LucideIcon> = {
  OPEN_SOURCE: Code2,
  APP: Smartphone,
  WEBSITE: Globe2,
  SITE_TOOL: Wrench,
};

const ProjectShowcaseCard: React.FC<ProjectShowcaseCardProps> = ({
  project,
  variant = 'standard',
}) => {
  const [coverFailed, setCoverFailed] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);
  const TypeIcon = TYPE_ICONS[project.type];
  const showCover = Boolean(project.coverImage) && !coverFailed;
  const visibleTags = project.tags.slice(0, variant === 'compact' ? 3 : 5);
  const websiteLabel =
    project.type === 'WEBSITE' || project.type === 'SITE_TOOL'
      ? '立即体验'
      : '访问官网';

  return (
    <article
      className={`group relative flex h-full overflow-hidden rounded-2xl bg-card ring-1 ring-border/70 transition duration-300 hover:-translate-y-1 hover:ring-primary/35 hover:shadow-xl hover:shadow-primary/5 ${
        variant === 'featured'
          ? 'min-h-[28rem] flex-col'
          : variant === 'compact'
            ? 'min-h-0 flex-col'
            : 'min-h-72 flex-col'
      }`}
    >
      {variant !== 'compact' && (
        <div
          className={`relative overflow-hidden bg-gradient-to-br from-primary/15 via-muted to-background ${
            variant === 'featured' ? 'min-h-52 flex-1' : 'h-36'
          }`}
        >
          {showCover ? (
            <img
              src={getMediaUrl(project.coverImage)}
              alt={`${project.name} 封面`}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <TypeIcon className="h-16 w-16 text-primary/45" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
          <div className="absolute left-5 top-5 flex items-center gap-2">
            <span className="rounded-md bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
              {SHOWCASE_PROJECT_TYPE_LABELS[project.type]}
            </span>
            {project.latestRelease && (
              <span className="rounded-md bg-background/85 px-2.5 py-1 font-mono text-xs text-muted-foreground shadow-sm backdrop-blur">
                v{project.latestRelease.versionName}
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className={`relative flex flex-1 flex-col ${
          variant === 'compact' ? 'p-4 sm:p-5' : 'p-5 sm:p-6'
        }`}
      >
        {variant === 'compact' && (
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{SHOWCASE_PROJECT_TYPE_LABELS[project.type]}</span>
            {project.latestRelease && (
              <span className="font-mono">
                v{project.latestRelease.versionName}
              </span>
            )}
          </div>
        )}
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            {project.icon && !iconFailed ? (
              <img
                src={getMediaUrl(project.icon)}
                alt={`${project.name} 图标`}
                className="h-full w-full object-cover"
                onError={() => setIconFailed(true)}
              />
            ) : (
              <TypeIcon className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h3
              className={`text-balance font-serif font-bold tracking-tight text-foreground ${
                variant === 'featured' ? 'text-2xl' : 'text-xl'
              }`}
            >
              {project.name}
            </h3>
            {project.platforms.length > 0 && (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {project.platforms.join(' · ')}
              </p>
            )}
          </div>
        </div>

        <p
          className={`text-pretty text-sm leading-6 text-muted-foreground ${
            variant === 'compact' ? 'line-clamp-2' : ''
          }`}
        >
          {project.summary}
        </p>

        {visibleTags.length > 0 && variant !== 'compact' && (
          <div className="mt-5 flex flex-wrap gap-2">
            {visibleTags.map(tag => (
              <span
                key={tag}
                className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > visibleTags.length && (
              <span className="px-1 py-1 text-xs text-muted-foreground">
                +{project.tags.length - visibleTags.length}
              </span>
            )}
          </div>
        )}

        <div
          className={`mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium ${
            variant === 'compact' ? 'pt-4' : 'pt-6'
          }`}
        >
          {project.websiteUrl && (
            <a
              href={project.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary transition-colors hover:text-primary/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ExternalLink className="h-4 w-4" />
              {websiteLabel}
            </a>
          )}
          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Code2 className="h-4 w-4" />
              查看源码
            </a>
          )}
          {project.effectiveDownloadUrl && (
            <a
              href={project.effectiveDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download className="h-4 w-4" />
              下载
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProjectShowcaseCard;
