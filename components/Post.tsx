'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react';
import { MessageCircle, Share2, MoreHorizontal, TrendingUp, Trash2, Edit } from 'lucide-react';
import Carousel from './Carousel'
import TimeAgo from './TimeAgo'
import CommentsList from './CommentsList'
import CommentForm from './CommentForm'
import { Avatar } from './Avatar'
import { Post as PostType, Comment, Pageable } from '../types'
import { getComments, createComment, deletePost, apiFetch } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

interface PostProps {
  post: PostType
  onDelete?: (postId: string) => void
  onUpdate?: (post: PostType) => void
  alwaysShowComments?: boolean
  initialComments?: Comment[]
  initialPageable?: any
  initialReplies?: Record<string, Comment[]>
  initialShowReplies?: Record<string, boolean>
  initialRepliesPageable?: Record<string, any>
  highlightedCommentId?: number | null
}

export function Post({ post, onDelete, onUpdate, alwaysShowComments = false, initialComments = [], initialPageable = null, initialReplies = {}, initialShowReplies = {}, initialRepliesPageable = {}, highlightedCommentId }: PostProps) {
  const { user } = useAuth()
  const { t } = useLocale()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [showComments, setShowComments] = useState(alwaysShowComments || initialComments.length > 0)
  const [commentsLoaded, setCommentsLoaded] = useState(initialComments.length > 0)
  const [commentsCount, setCommentsCount] = useState(post.comments_count || initialComments.length)
  const [commentsPageable, setCommentsPageable] = useState<any>(initialPageable)
  const [loadingMoreComments, setLoadingMoreComments] = useState(false)
  const [showAllComments, setShowAllComments] = useState(!highlightedCommentId)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const [showFullContent, setShowFullContent] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editYoutube, setEditYoutube] = useState('')
  const [editInstagram, setEditInstagram] = useState('')
  const [editing, setEditing] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  useEffect(() => {
    if (showComments && !commentsLoaded) {
      loadComments()
    }
  }, [showComments, commentsLoaded])

  useEffect(() => {
    if (isEditing) {
      setEditTitle(post.title || '')
      setEditContent(post.content)
      setEditYoutube(post.youtube_video || '')
      setEditInstagram(post.instagram_video || '')
    }
  }, [isEditing, post])

  const loadComments = async (page: number = 0, size: number = 10) => {
    const res = await getComments('posts', post.public_id, page, size)
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
      setIsDeleting(true)
      const res = await deletePost(post.public_id)
      if (res.ok) {
        setIsDeleted(true)
        // Add a small delay for the animation effect
        setTimeout(() => {
          onDelete?.(post.public_id)
        }, 300)
      } else {
        alert(res.body?.message || 'Failed to delete post')
        setIsDeleting(false)
      }
    }
  }

  const handleUpdate = async () => {
    setEditing(true)
    const res = await apiFetch(`/posts/${post.public_id}`, { method: 'PUT', body: JSON.stringify({ title: editTitle, content: editContent, youtube_video: editYoutube, instagram_video: editInstagram }) })
    if (res.ok) {
      onUpdate?.(res.body.data.post)
      setIsEditing(false)
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 2000)
    } else {
      alert(res.body.message || 'Failed to update post')
    }
    setEditing(false)
  }

  const handleShare = () => {
    const url = window.location.origin + '/posts/' + post.public_id
    const title = post.title || post.content.substring(0, 50) + '...'
    if (navigator.share) {
      navigator.share({
        title,
        url
      }).catch(() => {
      })
    }
  }

  const MAX_CONTENT_LENGTH = 200;
  const isLongContent = post.content && post.content.length > MAX_CONTENT_LENGTH;
  const displayContent = showFullContent || !isLongContent ? post.content : post.content.substring(0, MAX_CONTENT_LENGTH) + '...';

  if (isDeleted) return null

  return (
    <article className={`bg-white rounded-lg border border-gray-200 mb-4 max-w-full transition-all duration-300 ${
      isDeleting ? 'opacity-50 scale-95 transform' : 'opacity-100 scale-100'
    }`}>
      {/* Post Header */}
      <div className="p-4 max-w-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar
              name={post.user?.name || 'Unknown'}
              size={40}
            />
            <div>
              <div className="flex items-center gap-2">
                {post.user?.username ? (
                  <Link
                    href={`/${post.user.username}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {post.user.name || t('unknown')}
                  </Link>
                ) : (
                  <span>{post.user?.name || t('unknown')}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <TimeAgo date={post.created_at} className="text-xs text-gray-400" />
              </div>
            </div>
          </div>
          {user && user.id === post.user?.id && (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setIsEditing(true)
                }}
                className="p-2 hover:bg-gray-100 rounded-full text-blue-500 hover:text-blue-700"
                title="Edit"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete()
                }}
                disabled={isDeleting}
                className="p-2 hover:bg-gray-100 rounded-full text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('delete')}
              >
                <Trash2 className={`w-5 h-5 ${isDeleting ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {updateSuccess && (
          <div className="text-green-600 text-sm mb-2 animate-pulse">
            ✓ Post updated successfully!
          </div>
        )}

        {/* Post Title */}
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full border rounded p-2 mb-2 text-xl font-bold"
            placeholder="Title (optional)"
          />
        ) : (
          post.title && (
            alwaysShowComments ?
              <h1 className="text-2xl font-bold mb-2">{post.title}</h1> :
              <h3 className="font-semibold mb-2">{post.title}</h3>
          )
        )}

        {/* Post Content */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full border rounded p-2 mb-2"
              placeholder="Content"
            />
            <input
              type="text"
              value={editYoutube}
              onChange={(e) => setEditYoutube(e.target.value)}
              className="w-full border rounded p-2 mb-2"
              placeholder="YouTube Video ID"
            />
            <input
              type="text"
              value={editInstagram}
              onChange={(e) => setEditInstagram(e.target.value)}
              className="w-full border rounded p-2 mb-2"
              placeholder="Instagram Video ID"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={editing}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {editing ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-900 mb-3 break-words max-w-full" style={{ whiteSpace: 'pre-line' }}>{displayContent}</p>
            {isLongContent && !showFullContent && (
              <button onClick={() => setShowFullContent(true)} className="text-blue-600 hover:underline text-sm mb-3">See more</button>
            )}
          </>
        )}
      </div>

      {/* Post Media */}
      {(post.medias || post.youtube_video || post.instagram_video) && (
        <Carousel medias={post.medias || []} youtubeVideo={post.youtube_video} instagramVideo={post.instagram_video} />
      )}

      {/* Engagement Stats */}
      <div className="px-4 py-2 flex items-center justify-end text-sm text-gray-500 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span>{commentsCount} comments</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg flex-1 justify-center text-gray-600"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{t('comments')}</span>
        </button>
        <button
          onClick={handleShare}
          className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg ${alwaysShowComments ? 'flex-1' : 'flex-1'} justify-center text-gray-600`}
        >
          <Share2 className="w-5 h-5" />
          <span>{t('share')}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4">
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
    </article>
  );
}
