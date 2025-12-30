import { ImageWithFallback } from './figma/ImageWithFallback';
import { Clock, TrendingUp } from 'lucide-react';

interface StoryCardProps {
  image: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  readTime: string;
  trending?: boolean;
}

export function StoryCard({ image, category, title, excerpt, author, readTime, trending }: StoryCardProps) {
  return (
    <article className="group cursor-pointer">
      <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
        <ImageWithFallback
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {trending && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white rounded-md flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Trending</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <span className="text-sm text-blue-600">{category}</span>
        <h3 className="text-xl group-hover:text-blue-600 transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-gray-600 line-clamp-2">{excerpt}</p>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{author}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{readTime}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
