import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { News, Comment, Pageable } from '../../types'
import NewsItem from '../../components/NewsItem'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { useState, useEffect } from 'react'
import { createComment, getComments } from '../../utils/api'

interface NewsDetailPageProps {
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

export default function NewsDetailPage({ news, comments: initialComments, pageable: initialPageable, error, specificCommentId, initialReplies, initialShowReplies, initialRepliesPageable, fullUrl }: NewsDetailPageProps) {
  const { user } = useAuth()
  const { t, locale } = useLocale()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [pageable, setPageable] = useState<Pageable | null>(initialPageable || null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalComments, setTotalComments] = useState(news?.comments_count || initialComments.length)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.getMonth()
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const dayName = t('days')[date.getDay()]
    const monthShort = t('months_short')[month]
    // Dynamic timezone based on user timezone
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const timeZoneAbbr: { [key: string]: string } = {
      'Asia/Jakarta': 'JKT',
      'Asia/Bangkok': 'JKT',
      'Asia/Makassar': 'WITA',
      'Asia/Jayapura': 'WIT',
      // Add more as needed
    }
    const timezone = timeZoneAbbr[userTimeZone] || (() => {
      const offset = -new Date().getTimezoneOffset() / 60
      const sign = offset >= 0 ? '+' : ''
      return `UTC${sign}${offset}`
    })()
    return `${dayName}, ${day} ${monthShort} ${year} ${hours}:${minutes} ${timezone}`
  }

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

  const title = `${news.title} - ${news.organization?.title || 'Organization'}`
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
      <NewsItem
        news={news}
        isDetail={true}
        initialComments={comments}
        initialPageable={pageable}
        initialReplies={initialReplies}
        initialShowReplies={initialShowReplies}
        initialRepliesPageable={initialRepliesPageable}
        highlightedCommentId={specificCommentId}
      />
    </>
  )
}

export const getServerSideProps: GetServerSideProps<NewsDetailPageProps> = async (context) => {
  const { public_id } = context.params as { public_id: string }
  const { commentId } = context.query
  const protocol = (context.req.headers['x-forwarded-proto'] as string) || 'http'
  const host = context.req.headers.host
  const fullUrl = `${protocol}://${host}${context.req.url}`
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  // Extract auth token from cookies
  const cookies = context.req.headers.cookie || ''
  const tokenMatch = cookies.match(/s_user=([^;]+)/)
  const token = tokenMatch ? tokenMatch[1] : null
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    // Fetch news
    const newsRes = await fetch(`${API_BASE}/news/${public_id}`, { headers })

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
      const commentRes = await fetch(`${API_BASE}/news/${public_id}/comments/${commentId}?page=0&size=10`, { headers })
      if (commentRes.ok) {
        const commentData = await commentRes.json()
        if (commentData.statusCode === 2000) {
          const rootComment = commentData.data.comment as Comment
          const replies = commentData.data.replies as Comment[]
          const repliesPageable = commentData.data.pageable
          comments = [rootComment]
          initialReplies = { [rootComment.id]: replies }
          initialShowReplies = { [rootComment.id]: true }
          initialRepliesPageable = { [rootComment.id]: repliesPageable }
          specificCommentId = parseInt(commentId as string)
        }
      }
    } else {
      // Fetch all comments
      const commentsRes = await fetch(`${API_BASE}/news/${public_id}/comments?page=0&size=10`, { headers })
      const commentsData = commentsRes.ok ? await commentsRes.json() : { data: { content: [] } }
      comments = commentsData.data?.content || []
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