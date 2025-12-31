import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Users } from 'lucide-react';
import { getTrendingNews } from '../utils/api';
import { News } from '../types';

export function RightSidebar() {
  const [trendingNews, setTrendingNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await getTrendingNews(0, 5); // Fetch top 5 trending news
        if (res.ok && res.body?.data?.content) {
          setTrendingNews(res.body.data.content);
        }
      } catch (error) {
        console.error('Failed to fetch trending news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <aside className="hidden xl:block w-80 fixed right-0 top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
      {/* Trending Topics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-red-500" />
          <h2>Trending Topics</h2>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : trendingNews.length > 0 ? (
            trendingNews.map((news) => (
              <Link
                key={news.public_id}
                href={`/news/${news.public_id}`}
                className="block w-full text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <div className="text-blue-600 font-medium line-clamp-2">{news.title}</div>
                <div className="text-sm text-gray-500">{news.comments_count || 0} comments</div>
              </Link>
            ))
          ) : (
            <div className="text-sm text-gray-500">No trending topics</div>
          )}
        </div>
      </div>
    </aside>
  );
}
