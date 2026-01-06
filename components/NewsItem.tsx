import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Share2, ChevronDown, Crown } from 'lucide-react'
import CommentsList from './CommentsList'
import CommentForm from './CommentForm'
import { News, Comment } from '../types'
import { getComments, createComment } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

interface NewsItemProps {
  news: News
  hideOrganization?: boolean
  isDetail?: boolean
  alwaysShowComments?: boolean
  initialComments?: Comment[]
  initialPageable?: any
  initialReplies?: Record<string, Comment[]>
  initialShowReplies?: Record<string, boolean>
  initialRepliesPageable?: Record<string, any>
  highlightedCommentId?: number | null
}

export default function NewsItem({ news, hideOrganization = false, isDetail = false, alwaysShowComments = false, initialComments = [], initialPageable = null, initialReplies = {}, initialShowReplies = {}, initialRepliesPageable = {}, highlightedCommentId }: NewsItemProps) {
   const { user } = useAuth()
   const { t, locale } = useLocale()
   const [isExpanded, setIsExpanded] = useState(false)
   const itemRef = useRef<HTMLElement>(null)
   const prevIsExpandedRef = useRef(false)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [showComments, setShowComments] = useState(alwaysShowComments || initialComments.length > 0)
  const [commentsLoaded, setCommentsLoaded] = useState(initialComments.length > 0)
  const [commentsPageable, setCommentsPageable] = useState<any>(initialPageable)
  const [loadingMoreComments, setLoadingMoreComments] = useState(false)
  const [showAllComments, setShowAllComments] = useState(!highlightedCommentId)

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

  useEffect(() => {
    if (showComments && !commentsLoaded) {
      loadComments()
    }
  }, [showComments, commentsLoaded])

  useEffect(() => {
    if (!isExpanded && prevIsExpandedRef.current && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    prevIsExpandedRef.current = isExpanded
  }, [isExpanded])

  const loadComments = async (page: number = 0, size: number = 10) => {
    const res = await getComments('news', news.public_id, page, size)
    if (res.ok) {
      setComments(prev => page === 0 ? res.body.data.content || [] : [...prev, ...res.body.data.content])
      setCommentsPageable(res.body.data.pageable)
      setCommentsLoaded(true)
    }
  }

  const loadAllComments = () => {
    setShowAllComments(true)
    loadComments(0, 10)
  }

  const loadMoreComments = () => {
    if (!commentsPageable || loadingMoreComments) return
    const nextPage = commentsPageable.pageNumber + 1
    if (nextPage >= commentsPageable.totalPages) return
    setLoadingMoreComments(true)
    loadComments(nextPage, 10).finally(() => setLoadingMoreComments(false))
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

  // Function to clean HTML by removing empty paragraphs
  const cleanHTML = (html: string) => {
    return html.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '').replace(/<p>&nbsp;<\/p>/gi, '').replace(/<p><\/p>/gi, '')
  }

  // Function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  const cleanedContent = cleanHTML(news.content)
  const plainContent = isDetail ? '' : getPlainText(cleanedContent)
  const shouldTruncate = !isDetail && plainContent.length > 300
  const displayContent = isDetail || isExpanded ? cleanedContent : (shouldTruncate ? truncateText(plainContent, 300) : cleanedContent)

  const Container = isDetail ? 'div' : 'li'

  return (
    <Container ref={itemRef as any} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow mb-4">
      <div className="p-2">
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

        <div className="mb-3 flex justify-center items-center gap-2">
          <Link href={`/organizations/${news.organization_id}/spaces/${news.space_id}`}>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full cursor-pointer hover:bg-green-200">
              {news.space?.name || 'Space'}
            </span>
          </Link>
          {news.page_number && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {t('page')} {news.page_number}
            </span>
          )}
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
          {isDetail && news.can_access === false ? (
            <div className="text-center py-8">
              <p className="text-lg text-gray-600 mb-4">{t('subscribe_to_see_content')}</p>
              <Link href={`/organizations/${news.organization_id}`}>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {t('go_to_organization')}
                </button>
              </Link>
            </div>
          ) : isDetail || isExpanded ? (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
          ) : shouldTruncate ? (
            <p className="text-gray-700 leading-relaxed">
              {displayContent}
            </p>
          ) : (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
          )}
        </div>

        {news.youtube_video && (
          <div className="mb-3">
            <iframe
              width="560"
              height="315"
              src={`https://www.youtube.com/embed/${news.youtube_video}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}

        {news.editor && (
          <div className="mb-3">
            <span className="font-bold">({news.editor.name})</span>
          </div>
        )}

        {/* Engagement Stats */}
        {news.comments_count && news.comments_count > 0 ? (
          <div className="px-4 py-2 flex items-center justify-end text-sm text-gray-500 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span>{news.comments_count} comments</span>
            </div>
          </div>
        ) : ''}

        {/* Action Buttons */}
        <div className="px-4 py-2 flex items-center justify-around gap-2">
          {!isDetail && news.can_access !== false && shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg flex-1 justify-center text-gray-600"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              <span className="hidden md:inline">{isExpanded ? t('hide') : t('show_all')}</span>
            </button>
          )}
          {!isDetail && news.can_access === false && (
            <Link href={`/organizations/${news.organization_id}`}>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg flex-1 justify-center hover:bg-blue-700">
                <Crown className="w-5 h-5" />
                <span className="hidden md:inline">{t('subscribe')}</span>
              </button>
            </Link>
          )}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg flex-1 justify-center text-gray-600"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="hidden md:inline">{t('comments')}</span>
          </button>
          <button
            onClick={() => {
              const url = window.location.origin + '/news/' + news.public_id
              const title = news.title
              if (navigator.share) {
                navigator.share({
                  title,
                  url
                }).catch(() => {
                })
              }
            }}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg flex-1 justify-center text-gray-600"
          >
            <Share2 className="w-5 h-5" />
            <span className="hidden md:inline">{t('share')}</span>
          </button>
        </div>


        {showComments && (
          <div className="px-4 pb-4">
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

            {showAllComments && commentsPageable && commentsPageable.pageNumber + 1 < commentsPageable.totalPages && (
              <div className="mt-3 text-center">
                <button
                  onClick={loadMoreComments}
                  disabled={loadingMoreComments}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  {loadingMoreComments ? t('loading') : t('load_more')}
                </button>
              </div>
            )}

            {!showAllComments && highlightedCommentId && (
              <div className="mt-3 text-center">
                <button
                  onClick={loadAllComments}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  {t('show_all_comments')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}