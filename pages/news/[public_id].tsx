import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { News, Comment } from '../../types'
import CommentsList from '../../components/CommentsList'
import CommentForm from '../../components/CommentForm'
import { formatDate } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import { createComment } from '../../utils/api'

interface NewsDetailProps {
  news: News | null
  comments: Comment[]
  error?: string
}

export default function NewsDetail({ news, comments: initialComments, error }: NewsDetailProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>(initialComments)

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
      // Refresh comments - in a real app you'd fetch updated comments
      setComments([...comments, res.body.data.comment])
    } else {
      alert(res.body.message || 'Failed to post comment')
    }
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
        <article className="max-w-4xl mx-auto">
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
              <h2 className="text-2xl font-bold mb-4">Comments ({comments.length})</h2>

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
              />
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
      fetch(`${API_BASE}/news/${public_id}/comments?page=0&size=50`)
    ])

    if (!newsRes.ok) {
      return {
        props: {
          news: null,
          comments: [],
          error: 'News not found'
        }
      }
    }

    const newsData = await newsRes.json()
    const commentsData = commentsRes.ok ? await commentsRes.json() : { data: { comments: { data: [] } } }

    if (newsData.statusCode !== 2000) {
      return {
        props: {
          news: null,
          comments: [],
          error: newsData.message || 'Failed to load news'
        }
      }
    }

    return {
      props: {
        news: newsData.data.news,
        comments: commentsData.data?.comments?.data || []
      }
    }
  } catch (error) {
    return {
      props: {
        news: null,
        comments: [],
        error: 'Failed to load news'
      }
    }
  }
}