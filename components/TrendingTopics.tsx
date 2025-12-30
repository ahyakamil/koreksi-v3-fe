import { Hash, TrendingUp } from 'lucide-react';

const topics = [
  { name: '#SocialMediaRegulation', posts: '12.5K posts' },
  { name: '#DigitalPrivacy', posts: '8.3K posts' },
  { name: '#Misinformation2025', posts: '15.7K posts' },
  { name: '#InfluencerEthics', posts: '6.2K posts' },
  { name: '#AIJournalism', posts: '9.8K posts' },
];

export function TrendingTopics() {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-red-500" />
        <h2 className="text-xl">Trending Topics</h2>
      </div>
      <div className="space-y-4">
        {topics.map((topic, index) => (
          <button
            key={index}
            className="w-full text-left p-3 rounded-lg hover:bg-white transition-colors group"
          >
            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="group-hover:text-blue-600 transition-colors">
                  {topic.name}
                </div>
                <div className="text-sm text-gray-500">{topic.posts}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
