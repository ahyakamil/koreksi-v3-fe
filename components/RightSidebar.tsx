import { TrendingUp, Users } from 'lucide-react';

export function RightSidebar() {
  const trending = [{ topic: 'Web Development', posts: 1200 },];

  return (
    <aside className="hidden xl:block w-80 fixed right-0 top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
      {/* Trending Topics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-red-500" />
          <h2>Trending Topics</h2>
        </div>
        <div className="space-y-3">
          {trending.map((item, index) => (
            <button
              key={index}
              className="w-full text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <div className="text-blue-600">{item.topic}</div>
              <div className="text-sm text-gray-500">{item.posts} posts</div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
