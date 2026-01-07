import React, { useState, useEffect } from 'react';
import { Button, Input } from '@whispers/ui';
import { Search, Image, Video, Music, FileText, X, Check } from 'lucide-react';
import { api, getMediaUrl } from '@whispers/utils';

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
  onSelect: (url: string) => void;
  filterType?: 'image' | 'video' | 'audio' | 'all';
}

const MediaPickerDialog: React.FC<MediaPickerDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  filterType = 'image',
}) => {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, page]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };

      if (filterType !== 'all') {
        params.mimeType = `${filterType}/`;
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

  const handleSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia.url);
      onClose();
      setSelectedMedia(null);
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
      return <Image className="h-4 w-4 text-blue-500" />;
    if (mimeType.startsWith('video/'))
      return <Video className="h-4 w-4 text-purple-500" />;
    if (mimeType.startsWith('audio/'))
      return <Music className="h-4 w-4 text-green-500" />;
    return <FileText className="h-4 w-4 text-orange-500" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">选择媒体</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索文件..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>搜索</Button>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Image className="h-12 w-12 mb-2" />
              <p>暂无媒体文件</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {media.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedMedia?.id === item.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent hover:border-border'
                  }`}
                >
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    {item.mimeType.startsWith('image/') ? (
                      <img
                        src={getMediaUrl(item.thumbnail || item.url)}
                        alt={item.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        {getTypeIcon(item.mimeType)}
                        <span className="text-xs text-muted-foreground mt-1 truncate max-w-full px-1">
                          {item.mimeType.split('/')[1]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedMedia?.id === item.id && (
                    <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected File Info */}
        {selectedMedia && (
          <div className="p-4 border-t border-border bg-muted">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-muted-foreground/10 rounded flex items-center justify-center flex-shrink-0">
                {selectedMedia.mimeType.startsWith('image/') ? (
                  <img
                    src={getMediaUrl(
                      selectedMedia.thumbnail || selectedMedia.url
                    )}
                    alt=""
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  getTypeIcon(selectedMedia.mimeType)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-foreground">
                  {selectedMedia.originalName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedMedia.size)} -{' '}
                  {selectedMedia.mimeType}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pagination & Actions */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="flex items-center space-x-2">
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
                <span className="text-sm text-muted-foreground">
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
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSelect} disabled={!selectedMedia}>
              选择
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPickerDialog;
