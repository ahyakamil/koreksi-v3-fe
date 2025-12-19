import CommentForm from './CommentForm'
import TimeAgo from './TimeAgo'
import { useLocale } from '../context/LocaleContext'
import { useAuth } from '../context/AuthContext'
import { Comment, User } from '../types'

interface CommentsListProps {
  comments?: Comment[]
  onReply: (content: string, parentId?: string) => Promise<void>
  currentUser: User | null
}

export default function CommentsList({ comments = [], onReply, currentUser }: CommentsListProps) {
  const { t } = useLocale()

  const renderComment = (comment: Comment) => (
    <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-900">{comment.user?.name || 'Anonymous'}</div>
        <TimeAgo date={comment.created_at} className="text-xs text-gray-500" />
      </div>
      <div className="text-gray-700 mb-2">{comment.content}</div>
      {currentUser && (
        <button
          onClick={() => onReply('', comment.id)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Reply
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-3">
      {comments.length === 0 ? (
        <p className="text-gray-500 text-sm">No comments yet.</p>
      ) : (
        comments.map(comment => renderComment(comment))
      )}
    </div>
  )
}
