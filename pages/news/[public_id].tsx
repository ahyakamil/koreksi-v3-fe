import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { News, Comment, Pageable } from '../../types'
import CommentsList from '../../components/CommentsList'
import CommentForm from '../../components/CommentForm'
import { formatDate } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { useState, useEffect } from 'react'
import { createComment, getComments } from '../../utils/api'

interface NewsDetailProps {
    news: News | null
    comments: Comment[]
    pageable?: Pageable | null
    error?: string
    specificCommentId?: number | null
    initialReplies?: Record<string, Comment[]>
    initialShowReplies?: Record<string, boolean>
    initialRepliesPageable?: Record<string, any>
    fullUrl: string
}

export default function NewsDetail({ news, comments: initialComments, pageable: initialPageable, error, specificCommentId, initialReplies, initialShowReplies, initialRepliesPageable, fullUrl }: NewsDetailProps) {
  const { user } = useAuth()
  const { t } = useLocale()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [pageable, setPageable] = useState<Pageable | null>(initialPageable || null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalComments, setTotalComments] = useState(news?.comments_count || initialComments.length)

  useEffect(() => {
    if (specificCommentId) {
      const element = document.getElementById(`comment-${specificCommentId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [comments, specificCommentId])

  if (error || !news) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">{t('news_not_found')}</h1>
          <p>{error || t('failed_to_load')}</p>
        </div>
      </div>
    )
  }

  const title = `${news.title} - Koreksi`
  const description = news.content.length > 160 ? news.content.substring(0, 157) + '...' : news.content

  const handleCommentSubmit = async (content: string, parentId?: string) => {
    const res = await createComment('news', news.public_id, {
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

  const loadMoreComments = async () => {
    if (!pageable || loadingMore) return
    const nextPage = pageable.pageNumber + 1
    if (nextPage >= pageable.totalPages) return

    setLoadingMore(true)
    const res = await getComments('news', news.public_id, nextPage, 10)
    if (res.ok) {
      setComments(prev => [...prev, ...res.body.data.comments])
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
        <meta property="article:published_time" content={news.published_at || news.created_at} />
        {news.user && <meta property="article:author" content={news.user.name} />}
        {(news.organization || news.space) && <meta property="article:section" content={news.organization?.title || news.space?.name} />}
        {news.image && (
          <meta property="og:image" content={news.image} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {news.image && (
          <meta name="twitter:image" content={news.image} />
        )}
        <meta name="twitter:url" content={fullUrl} />
      </Head>
      <div className="container py-8">
        <article className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
          <header className="mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">{t('published')} {formatDate(news.published_at || news.created_at)}</div>
            </div>
            <h1 className="text-2xl font-bold mt-2">{news.title}</h1>
          </header>
          <div className="prose max-w-none">
            {news.image && (
              <figure className="mb-4">
                <img src={news.image} alt={news.title} className="w-full" />
                {news.caption && <figcaption className="text-sm text-gray-600 mt-2 text-center italic">{news.caption}</figcaption>}
              </figure>
            )}
            <div dangerouslySetInnerHTML={{ __html: news.content }} />
          </div>
          <footer className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{t('comments')} ({totalComments})</h3>
              {specificCommentId && (
                <div className="mt-2">
                  <button
                    onClick={() => window.location.href = `/news/${news.public_id}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {t('show_all_comments')}
                  </button>
                </div>
              )}

              {user && !specificCommentId && (
                <div className="mt-4">
                  <CommentForm
                    commentableType="news"
                    commentableId={news.public_id}
                    onSubmit={handleCommentSubmit}
                  />
                </div>
              )}

              <CommentsList
                comments={comments}
                onReply={handleCommentSubmit}
                currentUser={user}
                commentableType="news"
                commentableId={news.public_id}
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

export const getServerSideProps: GetServerSideProps<NewsDetailProps> = async (context) => {
  const { public_id } = context.params as { public_id: string }
  const { commentId } = context.query
  const protocol = (context.req.headers['x-forwarded-proto'] as string) || 'http'
  const host = context.req.headers.host
  const fullUrl = `${protocol}://${host}${context.req.url}`
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  try {
    // Fetch news
    const newsRes = await fetch(`${API_BASE}/news/${public_id}`)

    if (!newsRes.ok) {
      return {
        props: {
          news: null,
          comments: [],
          pageable: null,
          error: 'News not found',
          fullUrl
        }
      }
    }

    const newsData = await newsRes.json()

    if (newsData.statusCode !== 2000) {
      return {
        props: {
          news: null,
          comments: [],
          pageable: null,
          error: newsData.message || 'Failed to load news',
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
      const commentRes = await fetch(`${API_BASE}/news/${public_id}/comments/${commentId}?page=0&size=10`)
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
      const commentsRes = await fetch(`${API_BASE}/news/${public_id}/comments?page=0&size=10`)
      const commentsData = commentsRes.ok ? await commentsRes.json() : { data: { comments: [] } }
      comments = commentsData.data?.comments || []
      pageable = commentsData.data?.pageable || null
    }

    return {
      props: {
        news: newsData.data.news,
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
        news: null,
        comments: [],
        pageable: null,
        error: 'Failed to load news',
        fullUrl
      }
    }
  }
}