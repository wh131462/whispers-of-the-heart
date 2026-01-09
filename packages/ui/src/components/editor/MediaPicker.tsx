import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FileTree, type FileNode } from '../ui/file-tree';
import {
  Search,
  RefreshCw,
  Upload,
  X,
  Image,
  Video,
  Music,
} from 'lucide-react';

export type MediaType = 'image' | 'video' | 'audio' | 'all';

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnail?: string;
  createdAt: string;
}

/** 媒体选择结果 */
export interface MediaSelectResult {
  url: string;
  /** 原始文件名 */
  fileName?: string;
  /** 文件大小（字节） */
  fileSize?: number;
}

export interface MediaPickerProps {
  /** 是否打开 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 选择媒体后的回调 */
  onSelect: (result: MediaSelectResult) => void;
  /** 限制显示的媒体类型 */
  type?: MediaType;
  /** 获取媒体列表的函数 */
  fetchMedia?: (type: MediaType) => Promise<MediaItem[]>;
  /** 上传文件的函数 */
  uploadFile?: (file: File) => Promise<string>;
  /** 标题 */
  title?: string;
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 根据 mimeType 判断媒体类型
const getMediaType = (
  mimeType: string
): 'image' | 'video' | 'audio' | 'other' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'other';
};

// 获取文件的 accept 类型
const getAcceptType = (type: MediaType): string => {
  switch (type) {
    case 'image':
      return 'image/*';
    case 'video':
      return 'video/*,.m3u8';
    case 'audio':
      return 'audio/*';
    default:
      return 'image/*,video/*,audio/*';
  }
};

export const MediaPicker: React.FC<MediaPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  type = 'all',
  fetchMedia,
  uploadFile,
  title,
}) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 获取媒体列表
  const loadMedia = useCallback(async () => {
    if (!fetchMedia) return;
    setLoading(true);
    try {
      const items = await fetchMedia(type);
      setMediaList(items);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[MediaPicker] Failed to fetch media:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchMedia, type]);

  // 打开时加载媒体
  useEffect(() => {
    if (isOpen) {
      loadMedia();
      setSelectedId(null);
      setSearchTerm('');
    }
  }, [isOpen, loadMedia]);

  // 过滤后的媒体列表
  const filteredMedia = useMemo(() => {
    let items = mediaList;

    // 按类型过滤
    if (type !== 'all') {
      items = items.filter(m => getMediaType(m.mimeType) === type);
    }

    // 按搜索词过滤
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(m => m.originalName.toLowerCase().includes(term));
    }

    return items;
  }, [mediaList, type, searchTerm]);

  // 转换为树形结构
  const fileTreeData: FileNode[] = useMemo(() => {
    if (type !== 'all') {
      // 如果指定了类型，直接展示文件列表（不分组）
      return filteredMedia.map((item): FileNode => {
        const ext = item.originalName.split('.').pop()?.toLowerCase() || '';
        return {
          name: item.originalName,
          type: 'file',
          extension: ext,
          id: item.id,
          data: item,
        };
      });
    }

    // 按类型分组
    const images = filteredMedia.filter(
      m => getMediaType(m.mimeType) === 'image'
    );
    const videos = filteredMedia.filter(
      m => getMediaType(m.mimeType) === 'video'
    );
    const audios = filteredMedia.filter(
      m => getMediaType(m.mimeType) === 'audio'
    );

    const createFileNode = (item: MediaItem): FileNode => {
      const ext = item.originalName.split('.').pop()?.toLowerCase() || '';
      return {
        name: item.originalName,
        type: 'file',
        extension: ext,
        id: item.id,
        data: item,
      };
    };

    const folders: FileNode[] = [];

    if (images.length > 0) {
      folders.push({
        name: `图片 (${images.length})`,
        type: 'folder',
        id: 'folder-images',
        children: images.map(createFileNode),
      });
    }

    if (videos.length > 0) {
      folders.push({
        name: `视频 (${videos.length})`,
        type: 'folder',
        id: 'folder-videos',
        children: videos.map(createFileNode),
      });
    }

    if (audios.length > 0) {
      folders.push({
        name: `音频 (${audios.length})`,
        type: 'folder',
        id: 'folder-audios',
        children: audios.map(createFileNode),
      });
    }

    return folders;
  }, [filteredMedia, type]);

  // 处理文件选择
  const handleFileSelect = (node: FileNode) => {
    if (node.type === 'file' && node.data) {
      const mediaItem = node.data as MediaItem;
      setSelectedId(mediaItem.id);
    }
  };

  // 处理确认选择
  const handleConfirm = () => {
    if (selectedId) {
      const selected = filteredMedia.find(m => m.id === selectedId);
      if (selected) {
        onSelect({
          url: selected.url,
          fileName: selected.originalName,
          fileSize: selected.size,
        });
        onClose();
      }
    }
  };

  // 处理文件上传
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadFile) return;

    setUploading(true);
    try {
      const url = await uploadFile(file);
      onSelect({
        url,
        fileName: file.name,
        fileSize: file.size,
      });
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[MediaPicker] Failed to upload file:', error);
    } finally {
      setUploading(false);
      // 重置 input
      event.target.value = '';
    }
  };

  // 获取选中的媒体信息
  const selectedMedia = selectedId
    ? filteredMedia.find(m => m.id === selectedId)
    : null;

  // 获取标题
  const pickerTitle =
    title ||
    (type === 'image'
      ? '选择图片'
      : type === 'video'
        ? '选择视频'
        : type === 'audio'
          ? '选择音频'
          : '选择媒体');

  // 获取类型图标
  const TypeIcon =
    type === 'image'
      ? Image
      : type === 'video'
        ? Video
        : type === 'audio'
          ? Music
          : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {TypeIcon && <TypeIcon className="h-5 w-5 text-muted-foreground" />}
            <h2 className="text-lg font-semibold text-foreground">
              {pickerTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索文件名..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={loadMedia}
            disabled={loading}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            title="刷新"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {uploadFile && (
            <label className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-50">
              <Upload className="h-4 w-4" />
              {uploading ? '上传中...' : '上传'}
              <input
                type="file"
                accept={getAcceptType(type)}
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          {/* File Tree */}
          <div className="flex-1 overflow-auto p-4">
            {loading && mediaList.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
              </div>
            ) : fileTreeData.length > 0 ? (
              <FileTree
                data={fileTreeData}
                selectedId={selectedId || undefined}
                onSelect={handleFileSelect}
                header="媒体库"
                className="border-0 rounded-none bg-transparent"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Upload className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">暂无媒体文件</p>
                {uploadFile && (
                  <p className="text-xs mt-2">点击上传按钮添加文件</p>
                )}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {selectedMedia && (
            <div className="w-64 border-l border-border p-4 flex flex-col">
              {/* Preview */}
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden mb-4">
                {getMediaType(selectedMedia.mimeType) === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.originalName}
                    className="w-full h-full object-contain"
                  />
                ) : getMediaType(selectedMedia.mimeType) === 'video' ? (
                  <Video className="h-10 w-10 text-muted-foreground" />
                ) : (
                  <Music className="h-10 w-10 text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">文件名：</span>
                  <span className="text-foreground break-all">
                    {selectedMedia.originalName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">大小：</span>
                  <span className="text-foreground">
                    {formatFileSize(selectedMedia.size)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">类型：</span>
                  <span className="text-foreground">
                    {selectedMedia.mimeType}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确定选择
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaPicker;
