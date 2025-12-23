import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { Post, Comment, Pageable } from '../../types'
import Carousel from '../../components/Carousel'
import CommentsList from '../../components/CommentsList'
import CommentForm from '../../components/CommentForm'
import TimeAgo from '../../components/TimeAgo'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { useState, useEffect } from 'react'
import { createComment, getComments, deletePost } from '../../utils/api'

interface PostDetailProps {
    post: Post | null
    comments: Comment[]
    pageable?: Pageable | null
    error?: string
    specificCommentId?: number | null
    initialReplies?: Record<string, Comment[]>
    initialShowReplies?: Record<string, boolean>
    initialRepliesPageable?: Record<string, any>
    fullUrl: string
}
export default function PostDetail({ post, comments: initialComments, pageable: initialPageable, error, specificCommentId, initialReplies, initialShowReplies, initialRepliesPageable, fullUrl }: PostDetailProps) {

  const { user } = useAuth()
  const { t } = useLocale()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [pageable, setPageable] = useState<Pageable | null>(initialPageable || null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalComments, setTotalComments] = useState(post?.comments_count || initialComments.length)

  useEffect(() => {
    if (specificCommentId) {
      const element = document.getElementById(`comment-${specificCommentId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [comments, specificCommentId])

  if (error || !post) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">{t('post_not_found')}</h1>
          <p>{error || t('failed_to_load')}</p>
        </div>
      </div>
    )
  }

  const title = post.title ? `${post.title} - Koreksi` : 'Post - Koreksi'
  const description = post.content.length > 160 ? post.content.substring(0, 157) + '...' : post.content

  const handleCommentSubmit = async (content: string, parentId?: string) => {
    const res = await createComment('posts', post.public_id, {
      content,
      parent_id: parentId
    })

    if (res.ok) {
      // If it's a top-level comment, add to list
      if (!parentId) {
        setComments([...comments, res.body.data.comment])
      } else {
        // Update replies_count for the parent comment
        setComments(comments.map(c => c.id === parentId ? { ...c, replies_count: (c.replies_count || 0) + 1 } : c))
      }
      setTotalComments(prev => prev + 1)
    } else {
      alert(res.body.message || 'Failed to post comment')
    }
    return res
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this post?')) {
      const res = await deletePost(post.public_id)
      if (res.ok) {
        alert('Post deleted')
        window.location.href = '/'
      } else {
        alert(res.body?.message || 'Failed to delete post')
      }
    }
  }

  const loadMoreComments = async () => {
    if (!pageable || loadingMore) return
    const nextPage = pageable.pageNumber + 1
    if (nextPage >= pageable.totalPages) return

    setLoadingMore(true)
    const res = await getComments('posts', post.public_id, nextPage, 10)
    if (res.ok) {
      setComments(prev => [...prev, ...res.body.data.content])
      setPageable(res.body.data.pageable)
    }
    setLoadingMore(false)
  }


  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={fullUrl} />
        <meta property="og:site_name" content="Koreksi" />
        <meta property="article:published_time" content={post.created_at} />
        {post.user && <meta property="article:author" content={post.user.name} />}
        {post.medias && post.medias.length > 0 && (
          <meta property="og:image" content={post.medias[0].url} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {post.medias && post.medias.length > 0 && (
          <meta name="twitter:image" content={post.medias[0].url} />
        )}
        <meta name="twitter:url" content={fullUrl} />
      </Head>
      <div className="container py-8">
        <article className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
          <header className="mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">{t('by')} {post.user?.name || t('unknown')}</div>
              <div className="flex items-center space-x-2">
                <TimeAgo date={post.created_at} className="text-xs text-gray-400" />
                {user && user.id === post.user?.id && (
                  <button onClick={handleDelete} className="text-xs text-red-500 hover:text-red-700 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>{t('delete')}</span>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    const url = window.location.href
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
            {post.title && <h1 className="text-2xl font-bold mt-2">{post.title}</h1>}
          </header>
          <div className="prose max-w-none">
            <p>{post.content}</p>
            {post.medias && <Carousel medias={post.medias} />}
          </div>
          <footer className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{t('comments')} ({totalComments})</h3>
              {specificCommentId && (
                <div className="mt-2">
                  <button
                    onClick={() => window.location.href = `/post/${post.public_id}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {t('show_all_comments')}
                  </button>
                </div>
              )}

              {user && !specificCommentId && (
                <div className="mt-4">
                  <CommentForm
                    commentableType="posts"
                    commentableId={post.public_id}
                    onSubmit={handleCommentSubmit}
                  />
                </div>
              )}

              <CommentsList
                comments={comments}
                onReply={handleCommentSubmit}
                currentUser={user}
                commentableType="posts"
                commentableId={post.public_id}
                highlightedCommentId={specificCommentId}
                initialReplies={initialReplies}
                initialShowReplies={initialShowReplies}
                initialRepliesPageable={initialRepliesPageable}
              />

              {pageable && pageable.pageNumber + 1 < pageable.totalPages && !specificCommentId && (
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
          </footer>
        </article>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<PostDetailProps> = async (context) => {
  const { public_id } = context.params as { public_id: string }
  const { commentId } = context.query
  const protocol = (context.req.headers['x-forwarded-proto'] as string) || 'http'
  const host = context.req.headers.host
  const fullUrl = `${protocol}://${host}${context.req.url}`
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  try {
    // Fetch post
    const postRes = await fetch(`${API_BASE}/posts/${public_id}`)

    if (!postRes.ok) {
      return {
        props: {
          post: null,
          comments: [],
          pageable: null,
          error: 'Post not found',
          fullUrl
        }
      }
    }

    const postData = await postRes.json()

    if (postData.statusCode !== 2000) {
      return {
        props: {
          post: null,
          comments: [],
          pageable: null,
          error: postData.message || 'Failed to load post',
          fullUrl
        }
      }
    }

    let comments: Comment[] = []
    let pageable: any = null
    let specificCommentId: number | null = null
    let initialReplies: Record<string, Comment[]> = {}
    let initialShowReplies: Record<string, boolean> = {}
    let initialRepliesPageable: Record<string, any> = {}

    if (commentId) {
      // Fetch specific comment tree
      const commentRes = await fetch(`${API_BASE}/posts/${public_id}/comments/${commentId}?page=0&size=10`)
      if (commentRes.ok) {
        const commentData = await commentRes.json()
        if (commentData.statusCode === 2000) {
          const specificComment = commentData.data.comment as Comment
          const specificReplies = commentData.data.replies as any[] || []
          const pageable = commentData.data.pageable
          comments = [specificComment]
          // Set replies for the component
          initialReplies = { [specificComment.id]: specificReplies }
          initialShowReplies = { [specificComment.id]: true }
          initialRepliesPageable = { [specificComment.id]: pageable }
          specificCommentId = parseInt(commentId as string)
        }
      }
    } else {
      // Fetch all comments
      const commentsRes = await fetch(`${API_BASE}/posts/${public_id}/comments?page=0&size=10`)
      const commentsData = commentsRes.ok ? await commentsRes.json() : { data: { comments: [] } }
      comments = commentsData.data?.comments || []
      pageable = commentsData.data?.pageable || null
    }

    return {
      props: {
        post: postData.data.post,
        comments,
        pageable,
        specificCommentId,
        initialReplies,
        initialShowReplies,
        initialRepliesPageable,
        fullUrl
      }
    }
  } catch (error) {
    return {
      props: {
        post: null,
        comments: [],
        pageable: null,
        error: 'Failed to load post',
        fullUrl
      }
    }
  }
}