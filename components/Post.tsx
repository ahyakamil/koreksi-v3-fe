'use client'

import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, TrendingUp } from 'lucide-react';

interface PostProps {
  author: {
    name: string;
    avatar: string;
    verified?: boolean;
    title?: string;
  };
  timestamp: string;
  content: string;
  image?: string;
  category?: string;
  likes: number;
  comments: number;
  shares: number;
  trending?: boolean;
}

export function Post({ author, timestamp, content, image, category, likes, comments, shares, trending }: PostProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <article className="bg-white rounded-lg border border-gray-200 mb-4">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <img
              src={author.avatar}
              alt={author.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <span>{author.name}</span>
                {author.verified && (
                  <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                )}
                {trending && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                    <TrendingUp className="w-3 h-3" />
                    Trending
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {author.title && <span>{author.title}</span>}
                {author.title && <span>•</span>}
                <span>{timestamp}</span>
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Category Badge */}
        {category && (
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm mb-3">
            {category}
          </span>
        )}

        {/* Post Content */}
        <p className="text-gray-900 mb-3">{content}</p>
      </div>

      {/* Post Image */}
      {image && (
        <div className="w-full">
          <ImageWithFallback
            src={image}
            alt="Post content"
            className="w-full object-cover"
          />
        </div>
      )}

      {/* Engagement Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 border-b border-gray-200">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
              👍
            </div>
          </div>
          <span>{likeCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{comments} comments</span>
          <span>{shares} shares</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2 flex items-center justify-around">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg flex-1 justify-center transition-colors ${
            liked ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <ThumbsUp className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          <span>Like</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg flex-1 justify-center text-gray-600">
          <MessageCircle className="w-5 h-5" />
          <span>Comment</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg flex-1 justify-center text-gray-600">
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </button>
      </div>
    </article>
  );
}
