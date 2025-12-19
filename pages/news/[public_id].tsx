import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { News, Comment, Pageable } from '../../types'
import CommentsList from '../../components/CommentsList'
import CommentForm from '../../components/CommentForm'
import { formatDate } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import { createComment, getComments } from '../../utils/api'

interface NewsDetailProps {
  news: News | null
  comments: Comment[]
  pageable?: Pageable | null
  error?: string
}

export default function NewsDetail({ news, comments: initialComments, pageable: initialPageable, error }: NewsDetailProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [pageable, setPageable] = useState<Pageable | null>(initialPageable || null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalComments, setTotalComments] = useState(news?.comments_count || initialComments.length)

  if (error || !news) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">News not found</h1>
          <p>{error || 'The news article you are looking for does not exist.'}</p>
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
        {news.image && (
          <meta property="og:image" content={news.image} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {news.image && (
          <meta name="twitter:image" content={news.image} />
        )}
      </Head>
      <div className="container py-8">
        <article className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
          <header className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">
                by {news.user?.name || 'Unknown'} in{' '}
                <span className="font-medium">{news.organization?.title || 'Organization'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-400">{formatDate(news.published_at || news.created_at)}</div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {news.space?.name || 'Space'}
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold leading-tight">{news.title}</h1>
          </header>

          {news.image && (
            <div className="mb-6">
              <img
                src={news.image}
                alt={news.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="prose prose-lg max-w-none mb-8">
            <div dangerouslySetInnerHTML={{ __html: news.content }} />
          </div>

          <footer className="border-t pt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Comments ({totalComments})</h2>

              {user && (
                <div className="mb-6">
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
              />

              {pageable && pageable.pageNumber + 1 < pageable.totalPages && (
                <div className="mt-4 text-center">
                  <button
                    onClick={loadMoreComments}
                    disabled={loadingMore}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load More Comments'}
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
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  try {
    // Fetch news and comments in parallel
    const [newsRes, commentsRes] = await Promise.all([
      fetch(`${API_BASE}/news/${public_id}`),
      fetch(`${API_BASE}/news/${public_id}/comments?page=0&size=10`)
    ])

    if (!newsRes.ok) {
      return {
        props: {
          news: null,
          comments: [],
          pageable: null,
          error: 'News not found'
        }
      }
    }

    const newsData = await newsRes.json()
    const commentsData = commentsRes.ok ? await commentsRes.json() : { data: { comments: [] } }

    if (newsData.statusCode !== 2000) {
      return {
        props: {
          news: null,
          comments: [],
          pageable: null,
          error: newsData.message || 'Failed to load news'
        }
      }
    }

    return {
      props: {
        news: newsData.data.news,
        comments: commentsData.data?.comments || [],
        pageable: commentsData.data?.pageable || null
      }
    }
  } catch (error) {
    return {
      props: {
        news: null,
        comments: [],
        pageable: null,
        error: 'Failed to load news'
      }
    }
  }
}