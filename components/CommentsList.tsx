import CommentForm from './CommentForm'
import TimeAgo from './TimeAgo'
import { useLocale } from '../context/LocaleContext'
import { useAuth } from '../context/AuthContext'
import { Comment, User } from '../types'
import { useState, useEffect } from 'react'
import { getComments } from '../utils/api'

interface CommentsListProps {
   comments?: Comment[]
   onReply: (content: string, parentId?: string) => Promise<any>
   currentUser: User | null
   commentableType: string
   commentableId: string
   highlightedCommentId?: number | null
   initialReplies?: Record<string, Comment[]>
   initialShowReplies?: Record<string, boolean>
   initialRepliesPageable?: Record<string, any>
}

export default function CommentsList({ comments = [], onReply, currentUser, commentableType, commentableId, highlightedCommentId, initialReplies = {}, initialShowReplies = {}, initialRepliesPageable = {} }: CommentsListProps) {
  const { t } = useLocale()
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, Comment[]>>(initialReplies)
  const [repliesPageable, setRepliesPageable] = useState<Record<string, any>>(initialRepliesPageable)
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({})
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>(initialShowReplies)

  const loadReplies = async (commentId: string, page: number = 0, size: number = 10) => {
    setLoadingReplies(prev => ({ ...prev, [commentId]: true }))
    const res = await getComments(commentableType, commentableId, page, size, commentId)
    if (res.ok) {
      setReplies(prev => ({
        ...prev,
        [commentId]: page === 0 ? res.body.data.content : [...(prev[commentId] || []), ...res.body.data.content]
      }))
      setRepliesPageable(prev => ({ ...prev, [commentId]: res.body.data.pageable }))
    }
    setLoadingReplies(prev => ({ ...prev, [commentId]: false }))
  }

  const handleShowReplies = (commentId: string) => {
    setShowReplies(prev => ({ ...prev, [commentId]: true }))
    if (!replies[commentId]) {
      loadReplies(commentId, 0)
    }
  }

  const handleLoadMoreReplies = (commentId: string) => {
    const currentPage = repliesPageable[commentId]?.pageNumber || 0
    loadReplies(commentId, currentPage + 1, 10)
  }

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isHighlighted = highlightedCommentId && parseInt(comment.id) === highlightedCommentId
    return (
      <div key={comment.id} id={`comment-${comment.id}`} className={`p-3 rounded-lg ${isHighlighted ? 'bg-yellow-100 border-2 border-yellow-300' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-900">{comment.user?.name || 'Anonymous'}</div>
          <div className="flex items-center space-x-2">
            <TimeAgo date={comment.created_at} className="text-xs text-gray-500" />
            {!highlightedCommentId && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  const path = commentableType === 'posts' ? '/posts/' : commentableType === 'news' ? '/news/' : '/posts/'
                  const url = window.location.origin + path + commentableId + '?commentId=' + comment.id
                  const title = 'Comment by ' + (comment.user?.name || 'Anonymous')
                  if (navigator.share) {
                    navigator.share({
                      title,
                      url
                    }).catch(() => {
                    })
                  }
                }}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center space-x-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span>{t('share')}</span>
              </button>
            )}
          </div>
        </div>
        <div className="text-gray-700 mb-2">{comment.content}</div>
        {currentUser && !isReply && (
          <div className="flex space-x-2">
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {t('reply')}
            </button>
            {(comment.replies_count ?? 0) > 0 && !showReplies[comment.id] && (
              <button
                onClick={() => handleShowReplies(comment.id)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {t('show_replies')} ({comment.replies_count})
              </button>
            )}
          </div>
        )}
        {replyingTo === comment.id && (
          <div className="mt-2">
            <CommentForm
              commentableType={commentableType}
              commentableId={commentableId}
              onSubmit={async (content) => {
                const res = await onReply(content, comment.id)
                if (res.ok) {
                  const newReply = res.body.data.comment
                  setReplies(prev => ({ ...prev, [comment.id]: [...(prev[comment.id] || []), newReply] }))
                  setShowReplies(prev => ({ ...prev, [comment.id]: true }))
                }
                setReplyingTo(null)
              }}
            />
          </div>
        )}
        {showReplies[comment.id] && replies[comment.id] && (
          <div className={`${isHighlighted ? 'mt-2 space-y-2' : 'ml-6 mt-2 space-y-2'}`}>
            {replies[comment.id].map(reply => renderComment(reply, true))}
            {repliesPageable[comment.id] && repliesPageable[comment.id].pageNumber + 1 < repliesPageable[comment.id].totalPages && (
              <div className="text-center mt-2">
                <button
                  onClick={() => handleLoadMoreReplies(comment.id)}
                  disabled={loadingReplies[comment.id]}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {loadingReplies[comment.id] ? t('loading') : t('load_more_replies')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {comments.length === 0 ? (
        <p className="text-gray-500 text-sm">{t('no_comments')}</p>
      ) : (
        comments.map(comment => renderComment(comment))
      )}
    </div>
  )
}
