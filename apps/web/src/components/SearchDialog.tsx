import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { api } from '@whispers/utils';

interface SearchResult {
  id: string;
  title: string;
  type: 'post';
  excerpt?: string;
  slug: string;
  publishedAt?: string;
}

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // 当对话框打开时聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 处理搜索
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // 调用搜索API
      const response = await api.get('/blog/search', {
        params: {
          q: searchQuery,
          limit: 10,
        },
      });

      if (response.data?.success && response.data?.data?.items) {
        // 转换API数据格式为SearchResult格式
        const searchResults: SearchResult[] = response.data.data.items.map(
          (post: {
            id: string;
            title: string;
            excerpt?: string;
            content?: string;
            slug: string;
            publishedAt?: string;
            createdAt?: string;
          }) => ({
            id: post.id,
            title: post.title,
            type: 'post' as const,
            excerpt: post.excerpt || post.content?.substring(0, 100) || '',
            slug: post.slug,
            publishedAt: post.publishedAt || post.createdAt,
          })
        );
        setResults(searchResults);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
    }
  };

  // 处理结果点击
  const handleResultClick = (result: SearchResult) => {
    navigate(`/posts/${result.slug}`);
    onClose();
  };

  // 获取类型图标
  const getTypeIcon = () => {
    return <FileText className="h-4 w-4" />;
  };

  // 获取类型标签
  const getTypeLabel = () => {
    return '文章';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 搜索对话框 */}
      <div className="relative w-full max-w-2xl mx-4 bg-card rounded-lg shadow-2xl border border-border">
        {/* 搜索输入框 */}
        <div className="flex items-center p-4 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="搜索文章、视频、音频..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-0 shadow-none text-lg placeholder:text-muted-foreground focus-visible:ring-0"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 搜索结果 */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              搜索中...
            </div>
          ) : query.trim() ? (
            results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      'flex items-center p-4 hover:bg-muted cursor-pointer transition-colors',
                      selectedIndex === index && 'bg-muted'
                    )}
                  >
                    <div className="flex-shrink-0 mr-3 text-muted-foreground">
                      {getTypeIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {result.title}
                        </h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {getTypeLabel()}
                        </span>
                      </div>
                      {result.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {result.excerpt}
                        </p>
                      )}
                      {result.publishedAt && (
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(result.publishedAt).toLocaleDateString(
                            'zh-CN'
                          )}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>未找到相关结果</p>
                <p className="text-sm">尝试使用不同的关键词</p>
              </div>
            )
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>输入关键词开始搜索</p>
              <p className="text-sm">搜索博客文章</p>
            </div>
          )}
        </div>

        {/* 快捷键提示 */}
        <div className="px-4 py-2 border-t border-border bg-muted text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>使用 ↑↓ 键导航，Enter 键选择，Esc 键关闭</span>
            <div className="flex items-center space-x-4">
              <span>⌘K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
