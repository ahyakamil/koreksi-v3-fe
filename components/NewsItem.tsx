import Link from 'next/link'
import { useState, useEffect } from 'react'
import CommentsList from './CommentsList'
import CommentForm from './CommentForm'
import { News, Comment } from '../types'
import { getComments, createComment } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

interface NewsItemProps {
  news: News
  hideOrganization?: boolean
}

export default function NewsItem({ news, hideOrganization = false }: NewsItemProps) {
  const { user } = useAuth()
  const { t, locale } = useLocale()
  const [isExpanded, setIsExpanded] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.getMonth()
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const dayName = t('days')[date.getDay()]
    const monthShort = t('months_short')[month]
    // For timezone, using JKT as example, but dynamic
    const timezone = 'JKT' // TODO: make dynamic based on user timezone
    return `${dayName}, ${day} ${monthShort} ${year} ${hours}:${minutes} ${timezone}`
  }

  useEffect(() => {
    if (showComments && !commentsLoaded) {
      loadComments()
    }
  }, [showComments, commentsLoaded])

  const loadComments = async () => {
    const res = await getComments('news', news.public_id, 0, 100)
    if (res.ok) {
      setComments(res.body.data.content || [])
      setCommentsLoaded(true)
    }
  }

  const handleCommentSubmit = async (content: string, parentId?: string) => {
    const res = await createComment('news', news.public_id, {
      content,
      parent_id: parentId
    })

    if (res.ok) {
      if (!parentId) {
        setComments([...comments, res.body.data.comment])
      } else {
        // Update replies_count for the parent comment
        setComments(comments.map(c => c.id === parentId ? { ...c, replies_count: (c.replies_count || 0) + 1 } : c))
      }
    } else {
      alert(res.body.message || 'Failed to post comment')
    }
    return res
  }

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
      <div className="p-6">
        <h3 className="font-bold text-xl text-gray-900 mb-3 leading-tight text-center">
          {news.title}
        </h3>

        <div className="mb-3 text-sm text-gray-500 text-center">
          {news.user?.name || t('unknown')} - {!hideOrganization && (
            <Link href={`/organizations/${news.organization_id}`} className="text-blue-500 hover:text-blue-700 font-medium">
              {news.organization?.title || 'Organization'}
            </Link>
          )}
        </div>

        <div className="mb-3 text-sm text-gray-400 text-center">
          {formatDate(news.published_at || news.created_at)}
        </div>

        {news.image && (
          <div className="w-full overflow-hidden mb-3" style={{ maxHeight: '550px' }}>
            <img
              src={news.image}
              alt={news.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {news.caption && (
          <div className="mb-3 text-xs text-gray-500 text-left">
            {news.caption}
          </div>
        )}

        <div className="text-gray-700 leading-relaxed mb-3">
          {isExpanded ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
          ) : shouldTruncate ? (
            <p className="text-gray-700 leading-relaxed">
              {displayContent}
            </p>
          ) : (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
          )}
        </div>

        {news.editor && (
          <div className="mb-3">
            <span className="font-bold">({news.editor.name})</span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                {isExpanded ? t('hide') : t('show_all')}
              </button>
            )}
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showComments ? t('hide') : `${t('load_comments')}${news.comments_count && news.comments_count > 0 ? ` (${news.comments_count})` : ''}`}
            </button>
          </div>
        </div>

        {showComments && (
          <div className="mt-4 space-y-3">
            {user && (
              <CommentForm
                commentableType="news"
                commentableId={news.public_id}
                onSubmit={handleCommentSubmit}
              />
            )}
            <CommentsList
              comments={comments}
              onReply={handleCommentSubmit}
              currentUser={user}
              commentableType="news"
              commentableId={news.public_id}
            />
          </div>
        )}
      </div>
    </li>
  )
}