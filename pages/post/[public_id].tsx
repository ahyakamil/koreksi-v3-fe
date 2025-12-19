import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { Post, Comment } from '../../types'
import Carousel from '../../components/Carousel'
import CommentsList from '../../components/CommentsList'
import { formatDate } from '../../utils/format'

interface PostDetailProps {
  post: Post | null
  error?: string
}

export default function PostDetail({ post, error }: PostDetailProps) {
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
            <CommentsList postId={post.public_id} />
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
    const res = await fetch(`${API_BASE}/posts/${public_id}`)
    if (!res.ok) {
      return {
        props: {
          post: null,
          error: 'Post not found'
        }
      }
    }
    const data = await res.json()
    if (data.statusCode !== 2000) {
      return {
        props: {
          post: null,
          error: data.message || 'Failed to load post'
        }
      }
    }
    return {
      props: {
        post: data.data.post
      }
    }
  } catch (error) {
    return {
      props: {
        post: null,
        error: 'Failed to load post'
      }
    }
  }
}