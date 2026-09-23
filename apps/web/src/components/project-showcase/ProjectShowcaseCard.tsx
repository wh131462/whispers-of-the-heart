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
  showMetadata?: boolean;
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
  showMetadata = true,
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
      className={`group relative flex h-full overflow-hidden rounded-lg bg-card ring-1 ring-border/80 shadow-[0_8px_24px_-16px_hsl(var(--foreground)/0.36)] transition-[transform,box-shadow,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:bg-card hover:ring-primary/40 hover:shadow-[0_18px_38px_-20px_hsl(var(--foreground)/0.42),0_5px_16px_-10px_hsl(var(--primary)/0.24)] dark:shadow-[0_8px_24px_-16px_hsl(var(--background)/0.8)] dark:hover:shadow-[0_18px_38px_-20px_hsl(var(--background)/0.9),0_5px_16px_-10px_hsl(var(--primary)/0.3)] motion-reduce:transform-none motion-reduce:transition-none ${
        variant === 'featured'
          ? 'min-h-[30rem] flex-col'
          : variant === 'compact'
            ? 'min-h-0 flex-col'
            : 'min-h-[22rem] flex-col'
      }`}
    >
      {variant !== 'compact' && (
        <div
          className={`relative z-[1] -mb-px overflow-hidden bg-gradient-to-br from-primary/20 via-muted/80 to-background ${
            variant === 'featured' ? 'min-h-56 flex-1' : 'h-40'
          }`}
        >
          {showCover ? (
            <img
              src={getMediaUrl(project.coverImage)}
              alt={`${project.name} 封面`}
              className="h-full w-full object-cover saturate-[0.92] transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.015] group-hover:saturate-100 motion-reduce:transition-none"
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <TypeIcon className="h-16 w-16 text-primary/45" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/35 to-transparent" />
          <div className="absolute left-5 top-5 flex items-center gap-2">
            <span className="rounded-md bg-background/80 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-foreground shadow-sm backdrop-blur">
              {SHOWCASE_PROJECT_TYPE_LABELS[project.type]}
            </span>
            {project.latestRelease && (
              <span className="rounded-md bg-background/70 px-2.5 py-1 font-mono text-[11px] text-muted-foreground shadow-sm backdrop-blur">
                v{project.latestRelease.versionName}
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className={`relative z-[2] flex flex-1 flex-col bg-card ${
          variant === 'compact' ? 'p-5' : 'p-5 sm:p-7'
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
        <div className="mb-5 flex items-start gap-3">
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
                variant === 'featured' ? 'text-[1.7rem]' : 'text-xl'
              }`}
            >
              {project.name}
            </h3>
            {showMetadata && project.platforms.length > 0 && (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {project.platforms.join(' · ')}
              </p>
            )}
          </div>
        </div>

        <p
          className={`max-w-[42rem] text-pretty text-sm leading-6 text-muted-foreground ${
            variant === 'compact' ? 'line-clamp-2' : ''
          }`}
        >
          {project.summary}
        </p>

        {showMetadata && visibleTags.length > 0 && variant !== 'compact' && (
          <div className="mt-6 flex flex-wrap gap-2">
            {visibleTags.map(tag => (
              <span
                key={tag}
                className="rounded-md bg-muted/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > visibleTags.length && (
              <span className="px-1 py-1 text-[11px] text-muted-foreground">
                +{project.tags.length - visibleTags.length}
              </span>
            )}
          </div>
        )}

        <div
          className={`mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium ${
            variant === 'compact' ? 'pt-5' : 'pt-8'
          }`}
        >
          {project.websiteUrl && (
            <a
              href={project.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary transition-[color,transform] duration-200 ease-out hover:translate-x-0.5 hover:text-primary/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
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
              className="inline-flex items-center gap-1.5 text-foreground transition-[color,transform] duration-200 ease-out hover:translate-x-0.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
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
              className="inline-flex items-center gap-1.5 text-foreground transition-[color,transform] duration-200 ease-out hover:translate-x-0.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
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
