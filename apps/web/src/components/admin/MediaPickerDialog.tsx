import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, FileTree, type FileNode } from '@whispers/ui';
import {
  Search,
  Image,
  Video,
  Music,
  FileText,
  X,
  Check,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { api, getMediaUrl } from '@whispers/utils';
import { useToastContext } from '../../contexts/ToastContext';

interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnail?: string;
  createdAt: string;
}

interface MediaPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, media?: Media) => void;
  filterType?: 'image' | 'video' | 'audio' | 'file' | 'all';
  multiple?: boolean;
  title?: string;
}

const MediaPickerDialog: React.FC<MediaPickerDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  filterType = 'all',
  multiple: _multiple,
  title = '选择媒体文件',
}) => {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // 当 filterType 不是 'all' 时，锁定为指定类型
  const [activeFilter, setActiveFilter] = useState(filterType);
  const toast = useToastContext();
  const isFilterLocked = filterType !== 'all';

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, page, activeFilter]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: 24 };

      // file 类型和 all 类型不过滤 mimeType
      if (activeFilter !== 'all' && activeFilter !== 'file') {
        params.mimeType = `${activeFilter}/`;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await api.get('/media', { params });
      if (response.data?.success) {
        setMedia(response.data.data.items || []);
        setTotalPages(response.data.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch media:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchMedia();
  };

  // 验证媒体类型是否符合 filterType 要求
  const isMediaTypeAllowed = (media: Media) => {
    if (filterType === 'all') return true;
    if (filterType === 'file') {
      // file 类型允许所有文件（包括文档等非媒体文件）
      return true;
    }
    return media.mimeType.startsWith(`${filterType}/`);
  };

  const handleSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia.url, selectedMedia);
      onClose();
      setSelectedMedia(null);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    const failedFiles: string[] = [];

    try {
      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          await api.post('/media/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          successCount++;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          const errorMessage =
            err?.response?.data?.message || err?.message || '上传失败';
          failedFiles.push(`${file.name}: ${errorMessage}`);
        }
      }

      if (successCount > 0) {
        fetchMedia();
        toast.success(`成功上传 ${successCount} 个文件`);
      }

      if (failedFiles.length > 0) {
        toast.error(failedFiles.join('\n'), '上传失败');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || '上传失败';
      toast.error(errorMessage, '上传失败');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/'))
      return <Image className="h-6 w-6 text-blue-500" />;
    if (mimeType.startsWith('video/'))
      return <Video className="h-6 w-6 text-purple-500" />;
    if (mimeType.startsWith('audio/'))
      return <Music className="h-6 w-6 text-green-500" />;
    return <FileText className="h-6 w-6 text-orange-500" />;
  };

  // 将媒体文件转换为树形结构
  const fileTreeData: FileNode[] = useMemo(() => {
    const createFileNode = (item: Media): FileNode => {
      const ext = item.originalName.split('.').pop()?.toLowerCase() || '';
      return {
        name: item.originalName,
        type: 'file',
        extension: ext,
        id: item.id,
        data: item,
      };
    };

    // 按类型过滤
    const images = media.filter(m => m.mimeType.startsWith('image/'));
    const videos = media.filter(m => m.mimeType.startsWith('video/'));
    const audios = media.filter(m => m.mimeType.startsWith('audio/'));
    const documents = media.filter(
      m =>
        !m.mimeType.startsWith('image/') &&
        !m.mimeType.startsWith('video/') &&
        !m.mimeType.startsWith('audio/')
    );

    const folders: FileNode[] = [];

    // 根据 filterType 只添加对应类型的文件夹
    if (
      (filterType === 'all' ||
        filterType === 'image' ||
        filterType === 'file') &&
      images.length > 0
    ) {
      folders.push({
        name: `图片 (${images.length})`,
        type: 'folder',
        id: 'folder-images',
        children: images.map(createFileNode),
      });
    }

    if (
      (filterType === 'all' ||
        filterType === 'video' ||
        filterType === 'file') &&
      videos.length > 0
    ) {
      folders.push({
        name: `视频 (${videos.length})`,
        type: 'folder',
        id: 'folder-videos',
        children: videos.map(createFileNode),
      });
    }

    if (
      (filterType === 'all' ||
        filterType === 'audio' ||
        filterType === 'file') &&
      audios.length > 0
    ) {
      folders.push({
        name: `音频 (${audios.length})`,
        type: 'folder',
        id: 'folder-audios',
        children: audios.map(createFileNode),
      });
    }

    if (
      (filterType === 'all' || filterType === 'file') &&
      documents.length > 0
    ) {
      folders.push({
        name: `文档 (${documents.length})`,
        type: 'folder',
        id: 'folder-documents',
        children: documents.map(createFileNode),
      });
    }

    return folders;
  }, [media, filterType]);

  // 处理文件树节点选择
  const handleFileSelect = (node: FileNode) => {
    if (node.type === 'file' && node.data) {
      const mediaItem = node.data as Media;
      if (isMediaTypeAllowed(mediaItem)) {
        setSelectedMedia(mediaItem);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-background">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索文件名..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>

            {/* Filters - 只在 filterType 为 'all' 时显示 */}
            {!isFilterLocked && (
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                {(['all', 'image', 'video', 'audio'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      setActiveFilter(type);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      activeFilter === type
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {type === 'all'
                      ? '全部'
                      : type === 'image'
                        ? '图片'
                        : type === 'video'
                          ? '视频'
                          : '音频'}
                  </button>
                ))}
              </div>
            )}

            {/* Upload */}
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept={
                  filterType === 'image'
                    ? 'image/*'
                    : filterType === 'video'
                      ? 'video/*'
                      : filterType === 'audio'
                        ? 'audio/*'
                        : filterType === 'file'
                          ? undefined // 允许所有文件类型
                          : 'image/*,video/*,audio/*,.pdf,.doc,.docx'
                }
                onChange={handleUpload}
                className="hidden"
              />
              <Button variant="outline" disabled={uploading} asChild>
                <span>
                  {uploading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  上传
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Content - 左侧文件树 + 右侧预览 */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* 左侧文件树 */}
          <div className="flex-1 overflow-auto p-4 bg-muted/20">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
              </div>
            ) : media.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Image className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg">暂无媒体文件</p>
                <p className="text-sm mt-1">上传文件开始使用</p>
              </div>
            ) : (
              <FileTree
                data={fileTreeData}
                selectedId={selectedMedia?.id}
                onSelect={handleFileSelect}
                header="媒体库"
                className="border-0 rounded-none bg-transparent"
              />
            )}
          </div>

          {/* 右侧预览面板 */}
          <div className="w-72 border-l border-border flex flex-col bg-background">
            {selectedMedia ? (
              <>
                {/* 预览区域 */}
                <div className="p-4 border-b border-border">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {selectedMedia.mimeType.startsWith('image/') ? (
                      <img
                        src={getMediaUrl(selectedMedia.url)}
                        alt={selectedMedia.originalName}
                        className="w-full h-full object-contain"
                      />
                    ) : selectedMedia.mimeType.startsWith('video/') ? (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <Video className="h-12 w-12" />
                        <span className="text-xs mt-2">视频文件</span>
                      </div>
                    ) : selectedMedia.mimeType.startsWith('audio/') ? (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <Music className="h-12 w-12" />
                        <span className="text-xs mt-2">音频文件</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        {getTypeIcon(selectedMedia.mimeType)}
                        <span className="text-xs mt-2">
                          {selectedMedia.mimeType.split('/')[1]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 文件信息 */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-1">
                      文件名
                    </h3>
                    <p className="text-sm text-foreground break-all">
                      {selectedMedia.originalName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground mb-1">
                        类型
                      </h3>
                      <p className="text-sm text-foreground">
                        {selectedMedia.mimeType}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground mb-1">
                        大小
                      </h3>
                      <p className="text-sm text-foreground">
                        {formatFileSize(selectedMedia.size)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-1">
                      上传时间
                    </h3>
                    <p className="text-sm text-foreground">
                      {new Date(selectedMedia.createdAt).toLocaleDateString(
                        'zh-CN'
                      )}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm text-center">选择一个文件查看详情</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-background">
          {/* Pagination */}
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  下一页
                </Button>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSelect} disabled={!selectedMedia}>
              <Check className="h-4 w-4 mr-2" />
              选择
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPickerDialog;
