import React, { useState, useEffect } from 'react';
import { Link2, Mail, Check, X, Copy } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  description?: string;
}

// 社交平台配置
const socialPlatforms = [
  {
    id: 'wechat',
    name: '微信',
    color: '#07C160',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89l-.407-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z" />
      </svg>
    ),
  },
  {
    id: 'qq',
    name: 'QQ',
    color: '#12B7F5',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .686 4.078.43 6.29.43 2.212 0 6.29.256 6.29-.43 0-.687-1.77-1.182-1.77-1.182 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.746 2.072.111 0 .283-.36.283-1.025 0-2.514-2.166-6.954-2.166-6.954V9.325C18.29 3.364 14.268 2 12.003 2z" />
      </svg>
    ),
  },
  {
    id: 'weibo',
    name: '微博',
    color: '#E6162D',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.573h.014zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.579-.18-.405-.649.301-.809.332-1.504.006-1.999-.612-.93-2.275-.879-4.156-.026 0 0-.594.262-.442-.212.285-.936.242-1.721-.202-2.173-.939-1.01-3.473.03-5.66 2.321-1.635 1.715-2.584 3.473-2.584 4.997 0 2.929 3.748 4.703 7.404 4.703 4.799 0 7.994-2.79 7.994-5.007 0-1.335-1.132-2.089-1.955-1.955z" />
      </svg>
    ),
  },
  {
    id: 'twitter',
    name: 'X',
    color: '#000000',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: 'juejin',
    name: '掘金',
    color: '#1E80FF',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 14.316l7.454-5.88-2.022-1.625L12 11.1l-5.432-4.288-2.022 1.625 7.454 5.88zm0-11.316L0 12.053l4.853 3.82L12 10.426l7.147 5.447L24 12.053 12 3z" />
      </svg>
    ),
  },
  {
    id: 'email',
    name: '邮件',
    color: '#6366F1',
    icon: <Mail className="w-5 h-5" />,
  },
];

const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  title,
  url,
  description,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'platforms' | 'qrcode'>(
    'platforms'
  );
  const [qrLoading, setQrLoading] = useState(true);
  const { addToast } = useToast();

  // 重置状态当弹窗打开或 URL 变化时
  useEffect(() => {
    if (isOpen) {
      setQrLoading(true);
      setActiveTab('platforms');
    }
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      addToast({ title: '链接已复制', variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({ title: '复制失败', variant: 'destructive' });
    }
  };

  const handleShare = async (platformId: string) => {
    const shareText = description ? `${title} - ${description}` : title;

    switch (platformId) {
      case 'wechat':
        setActiveTab('qrcode');
        addToast({ title: '请使用微信扫描二维码', variant: 'default' });
        break;
      case 'qq':
        window.open(
          `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description || title)}`,
          '_blank',
          'width=600,height=500'
        );
        break;
      case 'weibo':
        window.open(
          `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareText)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'juejin':
        try {
          await navigator.clipboard.writeText(`[${title}](${url})`);
          addToast({
            title: '已复制 Markdown 链接',
            variant: 'success',
          });
        } catch {
          addToast({ title: '复制失败', variant: 'destructive' });
        }
        break;
      case 'email':
        window.open(
          `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description || title}\n\n${url}`)}`,
          '_blank'
        );
        break;
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* 弹窗内容 - 移动端底部弹出，桌面端居中 */}
      <div className="relative z-10 w-full sm:max-w-sm bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* 移动端拖动指示条 */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* 头部 */}
        <div className="flex items-center justify-between px-5 pt-2 sm:pt-4 pb-2">
          <h2 className="text-base font-semibold">分享</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* 文章信息 */}
        <div className="px-5 pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{title}</p>
        </div>

        {/* 标签切换 */}
        <div className="flex gap-1 px-5 pb-3">
          <button
            onClick={() => setActiveTab('platforms')}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              activeTab === 'platforms'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            平台
          </button>
          <button
            onClick={() => setActiveTab('qrcode')}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              activeTab === 'qrcode'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            二维码
          </button>
        </div>

        {/* 内容区域 */}
        <div className="px-5 pb-5">
          {activeTab === 'platforms' ? (
            /* 社交平台 - 左对齐 flex 布局 */
            <div className="flex flex-wrap gap-x-5 gap-y-4">
              {socialPlatforms.map(platform => (
                <button
                  key={platform.id}
                  onClick={() => handleShare(platform.id)}
                  className="flex flex-col items-center gap-1.5 group w-14"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-110 group-active:scale-95"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.icon}
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    {platform.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* 二维码区域 */
            <div className="flex flex-col items-center py-3">
              {/* 二维码容器 */}
              <div className="relative">
                {/* 装饰性渐变背景 */}
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl blur-sm" />

                {/* 二维码卡片 */}
                <div className="relative p-4 bg-white rounded-xl shadow-lg border border-gray-100">
                  {/* 四角装饰 */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary/60 rounded-tl" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary/60 rounded-tr" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary/60 rounded-bl" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary/60 rounded-br" />

                  {/* 加载状态 */}
                  {qrLoading && (
                    <div className="absolute inset-4 flex items-center justify-center bg-white/90 rounded-lg z-10">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <span className="text-xs text-muted-foreground">
                          生成中...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 二维码图片 */}
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-36 h-36 rounded"
                    onLoad={() => setQrLoading(false)}
                    onError={() => setQrLoading(false)}
                  />
                </div>
              </div>

              {/* 提示文字 */}
              <p className="mt-4 text-sm text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                使用手机扫描二维码访问
              </p>
            </div>
          )}
        </div>

        {/* 复制链接区域 - 移动端安全区域 */}
        <div className="px-5 pb-5 pt-2 border-t pb-safe">
          <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-xl">
            <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0 hidden sm:block" />
            <span className="flex-1 text-sm text-muted-foreground truncate min-w-0">
              {url}
            </span>
            <button
              onClick={handleCopyLink}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                copied
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">复制</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
