import CommentForm from './CommentForm'
import TimeAgo from './TimeAgo'
import { useLocale } from '../context/LocaleContext'
import { useAuth } from '../context/AuthContext'
import { Comment, User } from '../types'
import { useState } from 'react'
import { getComments } from '../utils/api'

interface CommentsListProps {
  comments?: Comment[]
  onReply: (content: string, parentId?: string) => Promise<any>
  currentUser: User | null
  commentableType: string
  commentableId: string
}

export default function CommentsList({ comments = [], onReply, currentUser, commentableType, commentableId }: CommentsListProps) {
  const { t } = useLocale()
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, Comment[]>>({})
  const [repliesPageable, setRepliesPageable] = useState<Record<string, any>>({})
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({})
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({})

  const loadReplies = async (commentId: string, page: number = 0, size: number = 3) => {
    setLoadingReplies(prev => ({ ...prev, [commentId]: true }))
    const res = await getComments(commentableType, commentableId, page, size, commentId)
    if (res.ok) {
      setReplies(prev => ({
        ...prev,
        [commentId]: page === 0 ? res.body.data.comments : [...(prev[commentId] || []), ...res.body.data.comments]
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
    loadReplies(commentId, currentPage + 1, 3)
  }

  const renderComment = (comment: Comment) => (
    <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-900">{comment.user?.name || 'Anonymous'}</div>
        <TimeAgo date={comment.created_at} className="text-xs text-gray-500" />
      </div>
      <div className="text-gray-700 mb-2">{comment.content}</div>
      {currentUser && !comment.parent_id && (
        <div className="flex space-x-2">
          <button
            onClick={() => setReplyingTo(comment.id)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Reply
          </button>
          {(comment.replies_count ?? 0) > 0 && !showReplies[comment.id] && (
            <button
              onClick={() => handleShowReplies(comment.id)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Show replies
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
    </div>
  )

  return (
    <div className="space-y-3">
      {comments.length === 0 ? (
        <p className="text-gray-500 text-sm">No comments yet.</p>
      ) : (
        comments.map(comment => (
          <div key={comment.id}>
            {renderComment(comment)}
            {showReplies[comment.id] && (
              <div className="ml-6 mt-2 space-y-2">
                {replies[comment.id]?.map(reply => renderComment(reply))}
                {repliesPageable[comment.id] && repliesPageable[comment.id].pageNumber + 1 < repliesPageable[comment.id].totalPages && (
                  <div className="text-center mt-2">
                    <button
                      onClick={() => handleLoadMoreReplies(comment.id)}
                      disabled={loadingReplies[comment.id]}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {loadingReplies[comment.id] ? 'Loading...' : 'Load more replies'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
