import { ImageWithFallback } from './figma/ImageWithFallback';

interface HeroStoryProps {
  image: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
}

export function HeroStory({ image, category, title, excerpt, author, date }: HeroStoryProps) {
  return (
    <article className="relative h-[500px] rounded-2xl overflow-hidden group cursor-pointer">
      <ImageWithFallback
        src={image}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <span className="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-sm mb-4">
          {category}
        </span>
        <h2 className="text-3xl sm:text-4xl text-white mb-4 group-hover:text-blue-300 transition-colors">
          {title}
        </h2>
        <p className="text-gray-200 mb-4 max-w-2xl">
          {excerpt}
        </p>
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <span>{author}</span>
          <span>•</span>
          <span>{date}</span>
        </div>
      </div>
    </article>
  );
}
