import Link from 'next/link'
import { useState } from 'react'
import TimeAgo from './TimeAgo'
import { News } from '../types'

interface NewsItemProps {
  news: News
}

export default function NewsItem({ news }: NewsItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Function to strip HTML tags and get plain text
  const getPlainText = (html: string) => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    return tempDiv.textContent || tempDiv.innerText || ''
  }

  // Function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  const plainContent = getPlainText(news.content)
  const shouldTruncate = plainContent.length > 300
  const displayContent = isExpanded ? news.content : (shouldTruncate ? truncateText(plainContent, 300) : news.content)

  return (
    <li className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {news.image && (
        <div className="w-full overflow-hidden" style={{ maxHeight: '550px' }}>
          <img
            src={news.image}
            alt={news.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-500">
            by {news.user?.name || 'Unknown'} in{' '}
            <Link href={`/organizations/${news.organization_id}`} className="text-blue-500 hover:text-blue-700 font-medium">
              {news.organization?.title || 'Organization'}
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <TimeAgo date={news.published_at || news.created_at} className="text-xs text-gray-400" />
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {news.space?.name || 'Space'}
            </span>
          </div>
        </div>

        <Link href={`/news/${news.public_id}`} className="block group">
          <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 mb-3 leading-tight">
            {news.title}
          </h3>
        </Link>

        <div className="text-gray-700 leading-relaxed">
          {isExpanded ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
          ) : (
            <p className="text-gray-700 leading-relaxed">
              {displayContent}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              {isExpanded ? 'Read Less' : 'Read More'}
            </button>
          )}
          <Link
            href={`/news/${news.public_id}`}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm ml-auto"
          >
            Read Full Article →
          </Link>
        </div>
      </div>
    </li>
  )
}