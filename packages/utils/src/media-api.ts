import { api } from './request';

export type MediaFilter = 'all' | 'image' | 'video' | 'audio' | 'file';
export type MediaPurpose = 'avatar' | 'logo' | 'cover' | 'editor' | 'library';

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnail?: string;
  tags?: string[];
  duration?: number;
  createdAt: string;
  uploader?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface MediaListResult {
  items: MediaItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface MediaListQuery {
  page?: number;
  limit?: number;
  type?: MediaFilter;
  search?: string;
  uploaderId?: string;
  all?: boolean;
}

export interface UploadMediaOptions {
  purpose?: MediaPurpose;
  tags?: string[];
  duration?: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const appendUploadOptions = (
  formData: FormData,
  options: UploadMediaOptions = {}
): void => {
  if (options.purpose) formData.append('purpose', options.purpose);
  if (options.tags?.length) formData.append('tags', options.tags.join(','));
  if (options.duration !== undefined) {
    formData.append('duration', String(options.duration));
  }
};

const unwrap = <T>(response: ApiEnvelope<T>): T => {
  if (response.success && response.data !== undefined) return response.data;
  throw new Error(response.message || '媒体操作失败');
};

export const listMedia = async (
  query: MediaListQuery = {}
): Promise<MediaListResult> => {
  const response = await api.get<ApiEnvelope<MediaListResult>>('/media', {
    params: {
      ...query,
      all: query.all ? 'true' : undefined,
    },
  });
  return unwrap(response.data);
};

export const uploadMedia = async (
  file: File,
  options: UploadMediaOptions = {}
): Promise<MediaItem> => {
  const formData = new FormData();
  formData.append('file', file);
  appendUploadOptions(formData, options);

  const response = await api.post<ApiEnvelope<MediaItem>>(
    '/media/upload',
    formData
  );
  return unwrap(response.data);
};

export const uploadMediaBatch = async (
  files: File[],
  options: Omit<UploadMediaOptions, 'duration'> = {}
): Promise<MediaItem[]> => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  appendUploadOptions(formData, options);

  const response = await api.post<ApiEnvelope<MediaItem[]>>(
    '/media/upload/multiple',
    formData
  );
  return unwrap(response.data);
};

export const getMedia = async (id: string): Promise<MediaItem> => {
  const response = await api.get<ApiEnvelope<MediaItem>>(`/media/${id}`);
  return unwrap(response.data);
};
