import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Loader2, Link2, ExternalLink } from 'lucide-react';
import { api } from '@whispers/utils';

interface FriendLink {
  id: string;
  name: string;
  url: string;
  avatar: string | null;
  description: string | null;
  sortOrder: number;
}

const getFaviconUrl = (url: string) => {
  try {
    const { origin } = new URL(url);
    return `${origin}/favicon.ico`;
  } catch {
    return null;
  }
};

const FriendsPage: React.FC = () => {
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await api.get('/friend-links');
        if (response.data?.success) {
          setLinks(response.data.data);
        } else if (Array.isArray(response.data?.data)) {
          setLinks(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch friend links:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <section className="text-center py-8">
        <h1 className="text-3xl font-bold text-foreground">友情链接</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          在互联网的角落里，遇见有趣的灵魂
        </p>
      </section>

      {links.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Link2 className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">暂无友链</p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              期待与你相遇
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {links.map(link => {
            const avatarSrc = link.avatar || getFaviconUrl(link.url);
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20"
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={link.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/30 transition-all duration-300 bg-background"
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                          (
                            e.currentTarget.nextElementSibling as HTMLElement
                          )?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-14 h-14 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center ring-2 ring-border group-hover:ring-primary/30 transition-all duration-300 ${avatarSrc ? 'hidden' : ''}`}
                    >
                      <span className="text-xl font-bold text-primary/60">
                        {link.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {link.name}
                      </h3>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                    {link.description ? (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {link.description}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 mt-1 italic">
                        {new URL(link.url).hostname}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
