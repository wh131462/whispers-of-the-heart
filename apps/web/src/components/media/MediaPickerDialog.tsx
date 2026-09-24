import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Skeleton,
} from '@whispers/ui';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image,
  Music,
  RefreshCw,
  Search,
  Upload,
  Video,
} from 'lucide-react';
import {
  getMediaUrl,
  listMedia,
  uploadMediaBatch,
  type MediaFilter,
  type MediaItem,
  type MediaPurpose,
} from '@whispers/utils';
import { useToastContext } from '../../contexts/ToastContext';

export interface MediaPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  filterType?: MediaFilter;
  multiple?: boolean;
  title?: string;
  purpose?: MediaPurpose;
  all?: boolean;
}

const FILTER_OPTIONS: Array<{
  value: Exclude<MediaFilter, 'file'>;
  label: string;
}> = [
  { value: 'all', label: '全部' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'audio', label: '音频' },
];

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  return `${parseFloat((bytes / 1024 ** index).toFixed(2))} ${units[index]}`;
};

const getMediaKind = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '图片';
  if (mimeType.startsWith('video/')) return '视频';
  if (mimeType.startsWith('audio/')) return '音频';
  return '文件';
};

const getTypeIcon = (mimeType: string, className = 'h-6 w-6') => {
  if (mimeType.startsWith('image/')) {
    return <Image className={`${className} text-sky-500`} />;
  }
  if (mimeType.startsWith('video/')) {
    return <Video className={`${className} text-violet-500`} />;
  }
  if (mimeType.startsWith('audio/')) {
    return <Music className={`${className} text-emerald-500`} />;
  }
  return <FileText className={`${className} text-amber-500`} />;
};

const getAcceptValue = (
  filter: MediaFilter,
  purpose: MediaPurpose
): string | undefined => {
  if (filter === 'image') {
    return purpose === 'avatar' || purpose === 'logo'
      ? 'image/jpeg,image/png,image/gif,image/webp'
      : 'image/*';
  }
  if (filter === 'video') return 'video/*';
  if (filter === 'audio') return 'audio/*';
  if (filter === 'file') return undefined;
  return 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
};

const MediaPreview: React.FC<{
  media: MediaItem;
  large?: boolean;
}> = ({ media, large = false }) => {
  if (media.mimeType.startsWith('image/')) {
    return (
      <img
        src={getMediaUrl(media.thumbnail || media.url)}
        alt={media.originalName}
        loading="lazy"
        className="h-full w-full object-contain"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
      <div
        className={
          large
            ? 'rounded-2xl bg-background/80 p-5'
            : 'rounded-xl bg-background/80 p-3'
        }
      >
        {getTypeIcon(media.mimeType, large ? 'h-10 w-10' : 'h-7 w-7')}
      </div>
      <span className="text-xs">{getMediaKind(media.mimeType)}</span>
    </div>
  );
};

const MediaPickerDialog: React.FC<MediaPickerDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  filterType = 'all',
  multiple: _multiple,
  title = '选择媒体文件',
  purpose = 'library',
  all = false,
}) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState<MediaFilter>(filterType);
  const filterTypeRef = useRef(filterType);
  const toast = useToastContext();
  const isFilterLocked = filterType !== 'all';

  const fetchMedia = useCallback(
    async (query: {
      page: number;
      filter: MediaFilter;
      search: string;
      includeAll: boolean;
    }): Promise<void> => {
      try {
        setLoading(true);
        const result = await listMedia({
          page: query.page,
          limit: 24,
          type: query.filter,
          search: query.search || undefined,
          all: query.includeAll || undefined,
        });
        setMedia(result.items);
        setTotalPages(result.totalPages || 1);
      } catch {
        toast.error('获取媒体列表失败');
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (filterTypeRef.current !== filterType) {
      filterTypeRef.current = filterType;
      setActiveFilter(filterType);
      setPage(1);
      setSelectedMedia(null);
      return;
    }

    if (isOpen) {
      void fetchMedia({
        page,
        filter: activeFilter,
        search: searchQuery,
        includeAll: all,
      });
    }
  }, [activeFilter, all, fetchMedia, filterType, isOpen, page, searchQuery]);

  useEffect(() => {
    if (!isOpen) setSelectedMedia(null);
  }, [isOpen]);

  const handleSearch = (): void => {
    const nextQuery = searchTerm.trim();
    if (nextQuery === searchQuery && page === 1) return;
    setPage(1);
    setSearchQuery(nextQuery);
  };

  const isMediaTypeAllowed = (item: MediaItem): boolean => {
    if (activeFilter === 'all' || activeFilter === 'file') return true;
    return item.mimeType.startsWith(`${activeFilter}/`);
  };

  const handleSelect = (): void => {
    if (!selectedMedia) return;
    onSelect(selectedMedia);
    onClose();
    setSelectedMedia(null);
  };

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const files = event.target.files;
    if (!files || files.length === 0 || uploading) return;

    setUploading(true);
    let successCount = 0;
    const failedFiles: string[] = [];

    try {
      try {
        const uploaded = await uploadMediaBatch(Array.from(files), { purpose });
        successCount = uploaded.length;
      } catch (error: unknown) {
        failedFiles.push(error instanceof Error ? error.message : '上传失败');
      }

      if (successCount > 0) {
        await fetchMedia({
          page,
          filter: activeFilter,
          search: searchQuery,
          includeAll: all,
        });
        toast.success(`成功上传 ${successCount} 个文件`);
      }

      if (failedFiles.length > 0) {
        toast.error(failedFiles.join('\n'), '上传失败');
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : '上传失败',
        '上传失败'
      );
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const accept = useMemo(
    () => getAcceptValue(activeFilter, purpose),
    [activeFilter, purpose]
  );

  const selectedLabel = selectedMedia ? '已选择 1 个文件' : '请选择一个文件';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex h-[min(92vh,760px)] max-h-[92vh] w-[calc(100%-1rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-2xl border-border/70 bg-background p-0 shadow-2xl sm:w-[calc(100%-2rem)]">
        <DialogHeader className="shrink-0 border-b border-border/70 bg-gradient-to-br from-muted/60 via-background to-background px-5 py-5 text-left sm:px-7 sm:py-6">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Upload className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-xl tracking-tight sm:text-2xl">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1 max-w-2xl text-sm leading-5">
                从媒体库选择已有文件，或上传新的媒体内容。
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex shrink-0 flex-col gap-3 border-b border-border/70 bg-background px-5 py-4 sm:px-7 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索文件名或标签"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') handleSearch();
              }}
              className="h-10 border-border/70 bg-muted/30 pl-9 pr-3"
              aria-label="搜索媒体"
            />
          </div>

          {!isFilterLocked && (
            <div
              className="flex shrink-0 items-center gap-1 overflow-x-auto rounded-lg bg-muted/60 p-1"
              aria-label="媒体类型筛选"
            >
              {FILTER_OPTIONS.map(option => (
                <Button
                  key={option.value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveFilter(option.value);
                    setPage(1);
                  }}
                  aria-pressed={activeFilter === option.value}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    activeFilter === option.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}

          <label
            className={`shrink-0 ${uploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
          >
            <input
              type="file"
              multiple
              accept={accept}
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
            <Button variant="default" asChild disabled={uploading}>
              <span>
                {uploading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploading ? '上传中' : '上传文件'}
              </span>
            </Button>
          </label>
        </div>

        <div className="scrollbar-thin-overlay min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/15">
          <div className="grid min-h-full grid-rows-[auto_auto] md:grid-cols-[minmax(0,1fr)_18rem] md:grid-rows-1">
            <section className="px-5 py-4 sm:px-7 sm:py-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    媒体库
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {loading
                      ? '正在同步文件…'
                      : `${media.length} 个文件 · ${selectedLabel}`}
                  </p>
                </div>
                {loading && (
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 8 }, (_, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-xl border border-border/60 bg-card"
                    >
                      <Skeleton className="aspect-[4/3] rounded-none" />
                      <div className="space-y-2 p-3">
                        <Skeleton className="h-3 w-4/5" />
                        <Skeleton className="h-2.5 w-2/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : media.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-background/60 px-6 text-center">
                  <div className="mb-4 rounded-2xl bg-muted p-4 text-muted-foreground">
                    <Upload className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    还没有媒体文件
                  </p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                    上传图片、视频、音频或文档后，它们会出现在这里。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {media.map(item => {
                    const isSelected = selectedMedia?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (isMediaTypeAllowed(item)) setSelectedMedia(item);
                        }}
                        aria-pressed={isSelected}
                        className={`group overflow-hidden rounded-xl border bg-card text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/25'
                            : 'border-border/70 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'
                        }`}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted/70">
                          <MediaPreview media={item} />
                          {isSelected && (
                            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 p-3">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.originalName}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {getMediaKind(item.mimeType)} ·{' '}
                            {formatFileSize(item.size)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="border-t border-border/70 bg-background p-4 sm:p-5 md:sticky md:top-0 md:self-start md:border-l md:border-t-0">
              {selectedMedia ? (
                <div className="flex h-full flex-col">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">
                      文件详情
                    </p>
                    <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      {getMediaKind(selectedMedia.mimeType)}
                    </span>
                  </div>

                  <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-border/70 bg-muted/60">
                    <MediaPreview media={selectedMedia} large />
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        文件名
                      </p>
                      <p className="mt-1 break-all text-sm font-medium leading-5 text-foreground">
                        {selectedMedia.originalName}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          类型
                        </p>
                        <p className="mt-1 break-all text-xs text-foreground">
                          {selectedMedia.mimeType}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          大小
                        </p>
                        <p className="mt-1 text-xs text-foreground">
                          {formatFileSize(selectedMedia.size)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        上传时间
                      </p>
                      <p className="mt-1 text-xs text-foreground">
                        {new Date(selectedMedia.createdAt).toLocaleDateString(
                          'zh-CN'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-44 flex-col items-center justify-center text-center text-muted-foreground">
                  <div className="mb-3 rounded-2xl bg-muted p-4">
                    <FileText className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    选择文件查看详情
                  </p>
                  <p className="mt-1 text-xs leading-5">
                    预览和文件信息会显示在这里
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-border/70 bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {totalPages > 1 ? `第 ${page} / ${totalPages} 页` : '媒体库'}
            </span>
            {totalPages > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  aria-label="上一页"
                  disabled={page === 1 || loading}
                  onClick={() => setPage(current => current - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  aria-label="下一页"
                  disabled={page === totalPages || loading}
                  onClick={() => setPage(current => current + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={handleSelect}
              disabled={!selectedMedia || uploading}
            >
              <Check className="mr-2 h-4 w-4" />
              使用此文件
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPickerDialog;
