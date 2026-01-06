import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { Post, Comment, Pageable } from '../../types'
import { Post as PostComponent } from '../../components/Post'
import { useLocale } from '../../context/LocaleContext'
import { useEffect } from 'react'

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
    baseUrl: string
}
export default function PostDetail({ post, comments, pageable, error, specificCommentId, initialReplies, initialShowReplies, initialRepliesPageable, fullUrl, baseUrl }: PostDetailProps) {

  const { t } = useLocale()

  useEffect(() => {
    if (specificCommentId) {
      const element = document.getElementById(`comment-${specificCommentId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [specificCommentId])

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
  const imageUrl = post.medias && post.medias.length > 0
    ? (post.medias[0].url.startsWith('http') ? post.medias[0].url : baseUrl + post.medias[0].url)
    : post.youtube_video
    ? `https://img.youtube.com/vi/${post.youtube_video}/0.jpg`
    : null


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
        {imageUrl && (
          <meta property="og:image" content={imageUrl} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {imageUrl && (
          <meta name="twitter:image" content={imageUrl} />
        )}
        <meta name="twitter:url" content={fullUrl} />
      </Head>
      <PostComponent
        post={post}
        alwaysShowComments={true}
        onDelete={() => window.location.href = '/'}
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
          fullUrl,
          baseUrl: `${protocol}://${host}`
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
          fullUrl,
          baseUrl: `${protocol}://${host}`
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
      const commentsData = commentsRes.ok ? await commentsRes.json() : { data: { content: [] } }
      comments = commentsData.data?.content || []
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
        fullUrl,
        baseUrl: `${protocol}://${host}`
      }
    }
  } catch (error) {
    return {
      props: {
        post: null,
        comments: [],
        pageable: null,
        error: 'Failed to load post',
        fullUrl,
        baseUrl: `${protocol}://${host}`
      }
    }
  }
}