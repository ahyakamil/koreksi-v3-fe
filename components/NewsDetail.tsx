import Link from 'next/link'
import { useState, useEffect } from 'react'
import CommentsList from './CommentsList'
import CommentForm from './CommentForm'
import { News, Comment, Pageable, ApiResponse } from '../types'
import { getComments, createComment } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

interface NewsDetailProps {
  news: News
  comments?: Comment[]
  pageable?: Pageable | null
  onCommentSubmit?: (content: string, parentId?: string) => Promise<any>
  onLoadMoreComments?: () => void
  showCommentsInitially?: boolean
  highlightedCommentId?: number | null
  initialReplies?: Record<string, Comment[]>
  initialShowReplies?: Record<string, boolean>
  initialRepliesPageable?: Record<string, any>
}

export default function NewsDetail({
  news,
  comments = [],
  pageable = null,
  onCommentSubmit,
  onLoadMoreComments,
  showCommentsInitially = false,
  highlightedCommentId,
  initialReplies,
  initialShowReplies,
  initialRepliesPageable
}: NewsDetailProps) {
  const { user } = useAuth()
  const { t, locale } = useLocale()
  const [pageableState, setPageableState] = useState<Pageable | null>(pageable)
  const [showComments, setShowComments] = useState(showCommentsInitially)
  const [commentsLoaded, setCommentsLoaded] = useState(comments.length > 0)
  const [loadingMore, setLoadingMore] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.getMonth()
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const dayName = t('days')[date.getDay()]
    const monthShort = t('months_short')[month]
    // Dynamic timezone based on user timezone
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const timeZoneAbbr: { [key: string]: string } = {
      'Asia/Jakarta': 'JKT',
      'Asia/Bangkok': 'JKT',
      'Asia/Makassar': 'WITA',
      'Asia/Jayapura': 'WIT',
      // Add more as needed
    }
    const timezone = timeZoneAbbr[userTimeZone] || (() => {
      const offset = -new Date().getTimezoneOffset() / 60
      const sign = offset >= 0 ? '+' : ''
      return `UTC${sign}${offset}`
    })()
    return `${dayName}, ${day} ${monthShort} ${year} ${hours}:${minutes} ${timezone}`
  }

  const handleCommentSubmit = async (content: string, parentId?: string) => {
    if (onCommentSubmit) {
      return await onCommentSubmit(content, parentId)
    } else {
      const res = await createComment('news', news.public_id, {
        content,
        parent_id: parentId
      })

      if (!res.ok) {
        alert(res.body.message || 'Failed to post comment')
      }
      return res
    }
  }

  const loadMoreComments = async () => {
    if (onLoadMoreComments) {
      onLoadMoreComments()
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-8">
        <h1 className="font-bold text-3xl text-gray-900 mb-4 leading-tight text-center">
          {news.title}
        </h1>

        <div className="mb-4 text-sm text-gray-500 text-center">
          {news.user?.name || t('unknown')} - (
          <Link href={`/organizations/${news.organization_id}`} className="text-blue-500 hover:text-blue-700 font-medium">
            {news.organization?.title || t('organization')}
          </Link>
          )
        </div>

        <div className="mb-4 text-sm text-gray-400 text-center">
          {formatDate(news.published_at || news.created_at)}
        </div>

        <div className="mb-4 flex justify-center">
          <Link href={`/organizations/${news.organization_id}/spaces/${news.space_id}`}>
            <span className="text-xs bg-green-100 text-green-800 px-3 py-2 rounded-full cursor-pointer hover:bg-green-200">
              {news.space?.name || t('space')}
            </span>
          </Link>
        </div>

        {news.image && (
          <div className="w-full overflow-hidden mb-6">
            <img
              src={news.image}
              alt={news.title}
              className="w-full h-auto object-cover rounded-lg"
            />
          </div>
        )}

        {news.caption && (
          <div className="mb-6 text-sm text-gray-500 text-center italic">
            {news.caption}
          </div>
        )}

        <div className="mb-6 flex justify-end">
          <button
            onClick={(e) => {
              e.preventDefault()
              const url = window.location.origin + '/news/' + news.public_id
              const title = news.title
              if (navigator.share) {
                navigator.share({
                  title,
                  url
                }).catch(() => {
                  // Fallback to clipboard
                  navigator.clipboard.writeText(url)
                  alert(t('url_copied_to_clipboard'))
                })
              } else {
                navigator.clipboard.writeText(url)
                alert('URL copied to clipboard!')
              }
            }}
            className="text-sm text-blue-500 hover:text-blue-700 flex items-center space-x-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>{t('share')}</span>
          </button>
        </div>

        <div className="text-gray-700 leading-relaxed mb-6">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />
        </div>

        {news.youtube_video && (
          <div className="mb-6 flex justify-center">
            <iframe
              width="560"
              height="315"
              src={`https://www.youtube.com/embed/${news.youtube_video}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        )}

        {news.editor && (
          <div className="mb-6 text-center">
            <span className="font-bold text-gray-600">{t('editor')}: {news.editor.name}</span>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center">
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-lg text-blue-600 hover:text-blue-800 font-medium"
          >
            {showComments ? t('hide') : `${t('load_comments')}${news.comments_count && news.comments_count > 0 ? ` (${news.comments_count})` : ''}`}
          </button>
        </div>

        {showComments && (
          <div className="mt-8 space-y-4">
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
              highlightedCommentId={highlightedCommentId}
              initialReplies={initialReplies}
              initialShowReplies={initialShowReplies}
              initialRepliesPageable={initialRepliesPageable}
            />
            {pageableState && pageableState.pageNumber + 1 < pageableState.totalPages && (
              <div className="mt-4 text-center">
                <button
                  onClick={loadMoreComments}
                  disabled={loadingMore}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingMore ? t('loading') : t('load_more') + ' ' + t('comments')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}