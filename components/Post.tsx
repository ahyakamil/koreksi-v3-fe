'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { MessageCircle, Share2, Trash2, Edit } from 'lucide-react'
import Carousel from './Carousel'
import TimeAgo from './TimeAgo'
import CommentsList from './CommentsList'
import CommentForm from './CommentForm'
import { Avatar } from './Avatar'
import { Post as PostType, Comment } from '../types'
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

export function Post({
  post,
  onDelete,
  onUpdate,
  alwaysShowComments = false,
  initialComments = [],
  initialPageable = null,
  initialReplies = {},
  initialShowReplies = {},
  initialRepliesPageable = {},
  highlightedCommentId
}: PostProps) {
  const { user } = useAuth()
  const { t } = useLocale()

  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [showComments, setShowComments] = useState(alwaysShowComments || initialComments.length > 0)
  const [commentsLoaded, setCommentsLoaded] = useState(initialComments.length > 0)
  const [commentsCount, setCommentsCount] = useState(post.comments_count || initialComments.length)
  const [commentsPageable, setCommentsPageable] = useState<any>(initialPageable)
  const [loadingMoreComments, setLoadingMoreComments] = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)

  const [showFullContent, setShowFullContent] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editYoutube, setEditYoutube] = useState('')
  const [editInstagram, setEditInstagram] = useState('')
  const [saving, setSaving] = useState(false)

  const MAX_CONTENT_LENGTH = 200
  const isLongContent = post.content?.length > MAX_CONTENT_LENGTH
  const displayContent =
    showFullContent || !isLongContent
      ? post.content
      : post.content.substring(0, MAX_CONTENT_LENGTH) + '...'

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

  const loadComments = async (page = 0, size = 10) => {
    const res = await getComments('posts', post.public_id, page, size)
    if (res.ok) {
      setComments(prev =>
        page === 0 ? res.body.data.content : [...prev, ...res.body.data.content]
      )
      setCommentsPageable(res.body.data.pageable)
      setCommentsLoaded(true)
    }
  }

  const handleCommentSubmit = async (content: string, parentId?: string) => {
    const res = await createComment('posts', post.public_id, {
      content,
      parent_id: parentId
    })

    if (res.ok) {
      if (!parentId) {
        setComments(prev => [...prev, res.body.data.comment])
      }
      setCommentsCount(prev => prev + 1)
    }

    return res
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    setIsDeleting(true)

    const res = await deletePost(post.public_id)
    if (res.ok) {
      setIsDeleted(true)
      setTimeout(() => onDelete?.(post.public_id), 300)
    } else {
      setIsDeleting(false)
    }
  }

  const handleUpdate = async () => {
    setSaving(true)
    const res = await apiFetch(`/posts/${post.public_id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: editTitle,
        content: editContent,
        youtube_video: editYoutube,
        instagram_video: editInstagram
      })
    })

    if (res.ok) {
      onUpdate?.(res.body.data.post)
      setIsEditing(false)
    }

    setSaving(false)
  }

  const handleShare = () => {
    if (!navigator.share) return
    navigator.share({
      title: post.title || 'Post',
      url: `${window.location.origin}/posts/${post.public_id}`
    })
  }

  if (isDeleted) return null

  return (
    <article className="bg-white rounded-lg border border-gray-200 mb-4 max-w-full overflow-hidden">
      {/* HEADER */}
      <div className="p-4 min-w-0">
        <div className="flex items-start justify-between mb-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={post.user?.name || 'Unknown'} size={40} />
            <div className="min-w-0">
              <Link
                href={`/${post.user?.username || ''}`}
                className="font-medium truncate block"
              >
                {post.user?.name || t('unknown')}
              </Link>
              <TimeAgo date={post.created_at} className="text-xs text-gray-400" />
            </div>
          </div>

          {user?.id === post.user?.id && (
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setIsEditing(true)}>
                <Edit className="w-5 h-5 text-blue-500" />
              </button>
              <button onClick={handleDelete} disabled={isDeleting}>
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>
          )}
        </div>

        {/* TITLE */}
        {isEditing ? (
          <input
            className="w-full border rounded p-2 mb-2"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
          />
        ) : (
          post.title && <h3 className="font-semibold mb-2">{post.title}</h3>
        )}

        {/* CONTENT */}
        {isEditing ? (
          <>
            <textarea
              rows={4}
              className="w-full border rounded p-2 mb-2"
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)}>Cancel</button>
              <button onClick={handleUpdate} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p
              className="text-gray-900 mb-3 max-w-full overflow-hidden"
              style={{
                whiteSpace: 'pre-line',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word'
              }}
            >
              {displayContent}
            </p>

            {isLongContent && !showFullContent && (
              <button
                className="text-blue-600 text-sm"
                onClick={() => setShowFullContent(true)}
              >
                See more
              </button>
            )}
          </>
        )}
      </div>

      {/* MEDIA */}
      {((post.medias && post.medias.length > 0) || post.youtube_video || post.instagram_video) && (
        <Carousel
          medias={post.medias || []}
          youtubeVideo={post.youtube_video}
          instagramVideo={post.instagram_video}
        />
      )}

      {/* ACTIONS */}
      <div className="px-4 py-2 flex justify-around">
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg flex-1 justify-center text-gray-600" >
          <MessageCircle className="w-5 h-5" /> <span>{t('comments')}</span>
        </button>
        <button
          onClick={handleShare}
          className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg ${alwaysShowComments ? 'flex-1' : 'flex-1'} justify-center text-gray-600`}
        >
          <Share2 className="w-5 h-5" /> <span>{t('share')}</span>
        </button>
      </div>

      {/* COMMENTS */}
      {showComments && (
        <div className="px-4 pb-4 min-w-0">
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
          />
        </div>
      )}
    </article>
  )
}
