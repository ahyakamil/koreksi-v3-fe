import Link from 'next/link'
import { useState, useEffect } from 'react'
import Carousel from './Carousel'
import TimeAgo from './TimeAgo'
import CommentsList from './CommentsList'
import CommentForm from './CommentForm'
import { Post, Comment, Pageable } from '../types'
import { getComments, createComment } from '../utils/api'
import { useAuth } from '../context/AuthContext'

interface PostItemProps {
  post: Post
}

export default function PostItem({ post }: PostItemProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
  const [pageable, setPageable] = useState<Pageable | null>(null)
  const [loadingMoreComments, setLoadingMoreComments] = useState(false)

  useEffect(() => {
    if (showComments && !commentsLoaded) {
      loadComments()
    }
  }, [showComments, commentsLoaded])

  const loadComments = async () => {
    const res = await getComments('posts', post.public_id, 0, 3)
    if (res.ok) {
      setComments(res.body.data.comments || [])
      setPageable(res.body.data.pageable || null)
      setCommentsLoaded(true)
    }
  }

  const loadMoreComments = async () => {
    if (!pageable || loadingMoreComments) return
    const nextPage = pageable.pageNumber + 1
    if (nextPage >= pageable.totalPages) return

    setLoadingMoreComments(true)
    const res = await getComments('posts', post.public_id, nextPage, 3)
    if (res.ok) {
      setComments(prev => [...prev, ...res.body.data.comments])
      setPageable(res.body.data.pageable)
    }
    setLoadingMoreComments(false)
  }

  const handleCommentSubmit = async (content: string, parentId?: string) => {
    const res = await createComment('posts', post.public_id, {
      content,
      parent_id: parentId
    })

    if (res.ok) {
      setComments([...comments, res.body.data.comment])
      setCommentsCount(prev => prev + 1)
    } else {
      alert(res.body.message || 'Failed to post comment')
    }
  }

  return (
    <li className="p-4 bg-white rounded shadow">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">by {post.user?.name || 'Unknown'}</div>
        <div className="flex items-center space-x-2">
          <TimeAgo date={post.created_at} className="text-xs text-gray-400" />
          <button
            onClick={(e) => {
              e.preventDefault()
              navigator.clipboard.writeText(window.location.origin + '/post/' + post.public_id)
              alert('URL copied to clipboard!')
            }}
            className="text-xs text-blue-500 hover:text-blue-700 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Share</span>
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
          {showComments ? 'Hide Comments' : `Show Comments${commentsCount > 0 ? ` (${commentsCount})` : ''}`}
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
            />

            {pageable && pageable.pageNumber + 1 < pageable.totalPages && (
              <div className="mt-3 text-center">
                <button
                  onClick={loadMoreComments}
                  disabled={loadingMoreComments}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  {loadingMoreComments ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  )
}