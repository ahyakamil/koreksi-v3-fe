import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { Post, Comment, Pageable } from '../../types'
import Carousel from '../../components/Carousel'
import CommentsList from '../../components/CommentsList'
import CommentForm from '../../components/CommentForm'
import { formatDate } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import { createComment, getComments } from '../../utils/api'

interface PostDetailProps {
  post: Post | null
  comments: Comment[]
  pageable?: Pageable | null
  error?: string
}

export default function PostDetail({ post, comments: initialComments, pageable: initialPageable, error }: PostDetailProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [pageable, setPageable] = useState<Pageable | null>(initialPageable || null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalComments, setTotalComments] = useState(post?.comments_count || initialComments.length)

  if (error || !post) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Post not found</h1>
          <p>{error || 'The post you are looking for does not exist.'}</p>
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
    const res = await getComments('posts', post.public_id, nextPage, 10)
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
        {post.medias && post.medias.length > 0 && (
          <meta property="og:image" content={post.medias[0].url} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {post.medias && post.medias.length > 0 && (
          <meta name="twitter:image" content={post.medias[0].url} />
        )}
      </Head>
      <div className="container py-8">
        <article className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
          <header className="mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">by {post.user?.name || 'Unknown'}</div>
              <div className="text-xs text-gray-400">{formatDate(post.created_at)}</div>
            </div>
            {post.title && <h1 className="text-2xl font-bold mt-2">{post.title}</h1>}
          </header>
          <div className="prose max-w-none">
            <p>{post.content}</p>
            {post.medias && <Carousel medias={post.medias} />}
          </div>
          <footer className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Comments ({totalComments})</h3>

              {user && (
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

export const getServerSideProps: GetServerSideProps<PostDetailProps> = async (context) => {
  const { public_id } = context.params as { public_id: string }
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  try {
    // Fetch post and comments in parallel
    const [postRes, commentsRes] = await Promise.all([
      fetch(`${API_BASE}/posts/${public_id}`),
      fetch(`${API_BASE}/posts/${public_id}/comments?page=0&size=10`)
    ])

    if (!postRes.ok) {
      return {
        props: {
          post: null,
          comments: [],
          pageable: null,
          error: 'Post not found'
        }
      }
    }

    const postData = await postRes.json()
    const commentsData = commentsRes.ok ? await commentsRes.json() : { data: { comments: [] } }

    if (postData.statusCode !== 2000) {
      return {
        props: {
          post: null,
          comments: [],
          pageable: null,
          error: postData.message || 'Failed to load post'
        }
      }
    }

    return {
      props: {
        post: postData.data.post,
        comments: commentsData.data?.comments || [],
        pageable: commentsData.data?.pageable || null
      }
    }
  } catch (error) {
    return {
      props: {
        post: null,
        comments: [],
        pageable: null,
        error: 'Failed to load post'
      }
    }
  }
}