'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MessageCircle, Share2, MoreHorizontal, TrendingUp } from 'lucide-react';
import Carousel from './Carousel'
import TimeAgo from './TimeAgo'
import CommentsList from './CommentsList'
import CommentForm from './CommentForm'
import { Avatar } from './Avatar'
import { Post as PostType, Comment, Pageable } from '../types'
import { getComments, createComment, deletePost } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

interface PostProps {
  post: PostType
  onDelete?: (postId: string) => void
}

export function Post({ post, onDelete }: PostProps) {
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

  const handleShare = () => {
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
  }

  return (
    <article className="bg-white rounded-lg border border-gray-200 mb-4">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar
              name={post.user?.name || 'Unknown'}
              size={40}
            />
            <div>
              <div className="flex items-center gap-2">
                <span>{post.user?.name || t('unknown')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <TimeAgo date={post.created_at} className="text-xs text-gray-400" />
                {user && user.id === post.user?.id && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete()
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t('delete')}
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Post Title */}
        {post.title && <h3 className="font-semibold mb-2">{post.title}</h3>}

        {/* Post Content */}
        <p className="text-gray-900 mb-3">{post.content}</p>
      </div>

      {/* Post Media */}
      {(post.medias || post.youtube_video) && (
        <div className="w-full">
          <Carousel medias={post.medias || []} youtubeVideo={post.youtube_video} />
        </div>
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
          <span>{t('comment')}</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg flex-1 justify-center text-gray-600"
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
    </article>
  );
}
