export type ShowcaseProjectType =
  | 'OPEN_SOURCE'
  | 'APP'
  | 'WEBSITE'
  | 'SITE_TOOL';

export type ShowcaseProjectStatus = 'DRAFT' | 'PUBLISHED';

export interface ShowcaseLatestRelease {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  releaseNotes: string | null;
}

export interface ShowcaseDistributedApp {
  id: string;
  name: string;
  slug: string;
}

export interface ShowcaseProject {
  id: string;
  name: string;
  slug: string;
  type: ShowcaseProjectType;
  summary: string;
  description: string | null;
  icon: string | null;
  coverImage: string | null;
  tags: string[];
  platforms: string[];
  repositoryUrl: string | null;
  websiteUrl: string | null;
  downloadUrl: string | null;
  status: ShowcaseProjectStatus;
  featured: boolean;
  sortOrder: number;
  distributedAppId: string | null;
  distributedApp: ShowcaseDistributedApp | null;
  latestRelease: ShowcaseLatestRelease | null;
  effectiveDownloadUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
}

export const SHOWCASE_PROJECT_TYPE_LABELS: Record<ShowcaseProjectType, string> =
  {
    OPEN_SOURCE: '开源项目',
    APP: 'APP',
    WEBSITE: '网站',
    SITE_TOOL: '站内工具',
  };

export const SHOWCASE_PROJECT_TYPES = Object.keys(
  SHOWCASE_PROJECT_TYPE_LABELS
) as ShowcaseProjectType[];
