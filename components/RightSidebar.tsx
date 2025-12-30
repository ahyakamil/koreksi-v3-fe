import { TrendingUp, Users } from 'lucide-react';

export function RightSidebar() {
  const trending = [
    { topic: '#SocialMediaRegulation', posts: '12.5K' },
    { topic: '#DigitalPrivacy', posts: '8.3K' },
    { topic: '#Misinformation2025', posts: '15.7K' },
    { topic: '#AIJournalism', posts: '9.8K' },
  ];

  const suggestions = [
    { 
      name: 'Reuters Media',
      followers: '2.3M followers',
      image: 'https://images.unsplash.com/photo-1672685667592-0392f458f46f?w=100&h=100&fit=crop'
    },
    { 
      name: 'ProPublica',
      followers: '890K followers',
      image: 'https://images.unsplash.com/photo-1649589244330-09ca58e4fa64?w=100&h=100&fit=crop'
    },
    { 
      name: 'Digital Rights Watch',
      followers: '456K followers',
      image: 'https://images.unsplash.com/photo-1672685667592-0392f458f46f?w=100&h=100&fit=crop'
    },
  ];

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

      {/* Suggested Channels */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h2>Suggested Channels</h2>
        </div>
        <div className="space-y-3">
          {suggestions.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <img
                src={item.image}
                alt={item.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div>{item.name}</div>
                <div className="text-sm text-gray-500">{item.followers}</div>
              </div>
              <button className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
