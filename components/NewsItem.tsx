import Link from 'next/link'
import { useState, useEffect } from 'react'
import TimeAgo from './TimeAgo'
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
  const { t } = useLocale()
  const [isExpanded, setIsExpanded] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)

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
      {news.image && (
        <div className="w-full overflow-hidden" style={{ maxHeight: '550px' }}>
          <img
            src={news.image}
            alt={news.title}
            className="w-full h-full object-cover"
          />
          {news.caption && (
            <div className="p-3 bg-gray-50 text-sm text-gray-600 italic text-center">
              {news.caption}
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {t('by')} {news.user?.name || t('unknown')}
              {!hideOrganization && (
                <> in{' '}
                  <Link href={`/organizations/${news.organization_id}`} className="text-blue-500 hover:text-blue-700 font-medium">
                    {news.organization?.title || 'Organization'}
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <TimeAgo date={news.published_at || news.created_at} className="text-xs text-gray-400" />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  navigator.clipboard.writeText(window.location.origin + '/news/' + news.public_id)
                  alert('URL copied to clipboard!')
                }}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span>{t('share')}</span>
              </button>
            </div>
          </div>
          <div className="mt-1">
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {news.space?.name || 'Space'}
            </span>
          </div>
        </div>

        <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 mb-3 leading-tight">
          {news.title}
        </h3>

        <div className="text-gray-700 leading-relaxed">
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