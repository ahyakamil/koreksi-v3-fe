import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { getPostsByUsername } from '../utils/api'
import { Post } from '../types'
import { Layout } from '../components/Layout'
import { Post as PostComponent } from '../components/Post'

export default function UserPostsPage() {
  const router = useRouter()
  const { username } = router.query
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalElements, setTotalElements] = useState(0)
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (username && typeof username === 'string') {
      fetchPosts(username, 0, true)
    }
  }, [username])

  const fetchPosts = async (user: string, page: number, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      const response = await getPostsByUsername(user, page)

      if (response.ok && response.body) {
        const data = response.body.data
        const newPosts = data.content || []

        if (reset) {
          setPosts(newPosts)
          setTotalElements(data.pageable?.totalElements || 0)
        } else {
          setPosts(prev => [...prev, ...newPosts])
        }

        setCurrentPage(data.pageable?.pageNumber || 0)
        setHasMore(newPosts.length > 0 && (data.pageable?.pageNumber || 0) + 1 < (data.pageable?.totalPages || 0))
      } else {
        setError(response.body?.message || 'Failed to load posts')
        setHasMore(false)
      }
    } catch (err) {
      setError('Failed to load posts')
      setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore && username && typeof username === 'string') {
      const nextPage = currentPage + 1
      fetchPosts(username, nextPage, false)
    }
  }, [loadingMore, hasMore, username, currentPage])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMorePosts()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current)
      }
    }
  }, [loadMorePosts, hasMore, loadingMore])

  if (loading) {
    return (
      <Layout showSidebar={false} showRightSidebar={false}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout showSidebar={false} showRightSidebar={false}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              Go back home
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout showSidebar={false} showRightSidebar={false}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Posts by @{username}
          </h1>
          <p className="text-gray-600">
            {posts.length} post{posts.length !== 1 ? 's' : ''} loaded
            {totalElements > 0 && ` (${totalElements} total)`}
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No posts found</div>
            <p className="text-gray-400 mt-2">This user hasn't posted anything yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostComponent key={post.public_id} post={post} />
            ))}
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        {hasMore && (
          <div ref={observerRef} className="flex justify-center items-center py-8">
            {loadingMore ? (
              <div className="text-gray-500">Loading more posts...</div>
            ) : (
              <div className="text-gray-400 text-sm">Scroll down to load more</div>
            )}
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-sm">No more posts to load</div>
          </div>
        )}
      </div>
    </Layout>
  )
}