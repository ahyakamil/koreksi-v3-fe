import Link from 'next/link'
import { useState, useEffect } from 'react'
import Carousel from './Carousel'
import TimeAgo from './TimeAgo'
import CommentsList from './CommentsList'
import CommentForm from './CommentForm'
import { Post, Comment, Pageable } from '../types'
import { getComments, createComment, deletePost } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

interface PostItemProps {
  post: Post
  onDelete?: (postId: string) => void
}

export default function PostItem({ post, onDelete }: PostItemProps) {
  const { user } = useAuth()
  const { t } = useLocale()
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
  const [commentsPageable, setCommentsPageable] = useState<any>(null)
  const [loadingMoreComments, setLoadingMoreComments] = useState(false)

  useEffect(() => {
    if (showComments && !commentsLoaded) {
      loadComments()
    }
  }, [showComments, commentsLoaded])

  const loadComments = async (page: number = 0, size: number = 10) => {
    const res = await getComments('posts', post.public_id, page, size)
    if (res.ok) {
      setComments(prev => page === 0 ? res.body.data.content || [] : [...prev, ...res.body.data.content])
      setCommentsPageable(res.body.data.pageable)
      setCommentsLoaded(true)
    }
  }

  const loadMoreComments = () => {
    if (!commentsPageable || loadingMoreComments) return
    const nextPage = commentsPageable.pageNumber + 1
    if (nextPage >= commentsPageable.totalPages) return
    setLoadingMoreComments(true)
    loadComments(nextPage, 10).finally(() => setLoadingMoreComments(false))
  }


  const handleCommentSubmit = async (content: string, parentId?: string) => {
    const res = await createComment('posts', post.public_id, {
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
      setCommentsCount(prev => prev + 1)
    } else {
      alert(res.body.message || 'Failed to post comment')
    }
    return res
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this post?')) {
      const res = await deletePost(post.public_id)
      if (res.ok) {
        onDelete?.(post.public_id)
      } else {
        alert(res.body?.message || 'Failed to delete post')
      }
    }
  }

  return (
    <li className="p-4 bg-white rounded shadow">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{t('by')} {post.user?.name || t('unknown')}</div>
        <div className="flex items-center space-x-2">
          <TimeAgo date={post.created_at} className="text-xs text-gray-400" />
          {user && user.id === post.user?.id && (
            <button
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="text-xs text-red-500 hover:text-red-700 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>{t('delete')}</span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault()
              const url = window.location.origin + '/post/' + post.public_id
              const title = post.title || post.content.substring(0, 50) + '...'
              if (navigator.share) {
                navigator.share({
                  title,
                  url
                }).catch(() => {
                  // Fallback to clipboard
                  navigator.clipboard.writeText(url)
                  alert('URL copied to clipboard!')
                })
              } else {
                navigator.clipboard.writeText(url)
                alert('URL copied to clipboard!')
              }
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
      <div>
        {post.title && <h3 className="font-semibold">{post.title}</h3>}
        <div className="mt-1">{post.content}</div>
        {post.medias && <Carousel medias={post.medias} />}
      </div>
      <div className="mt-3">
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showComments ? t('hide') : `${t('load_comments')}${commentsCount > 0 ? ` (${commentsCount})` : ''}`}
        </button>

        {showComments && (
          <div className="mt-3 space-y-3">
            {user && (
              <CommentForm
                commentableType="posts"
                commentableId={post.public_id}
                onSubmit={handleCommentSubmit}
              />
            )}
            <CommentsList
              comments={comments}
              onReply={handleCommentSubmit}
              currentUser={user}
              commentableType="posts"
              commentableId={post.public_id}
            />

            {commentsPageable && commentsPageable.pageNumber + 1 < commentsPageable.totalPages && (
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

          </div>
        )}
      </div>
    </li>
  )
}