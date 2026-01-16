import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { getPostsByUsername, sendFriendRequest, checkFriendshipStatus } from '../utils/api'
import { useFullscreen } from '../context/FullscreenContext'
import { useAuth } from '../context/AuthContext'
import { Post } from '../types'
import { Post as PostComponent } from '../components/Post'

export default function UserPostsPage() {
  const router = useRouter()
  const { username } = router.query
  const { isFullscreen } = useFullscreen()
  const { user: currentUser } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalElements, setTotalElements] = useState(0)
  const [profileUser, setProfileUser] = useState<any>(null)
  const [sendingRequest, setSendingRequest] = useState(false)
  const [friendshipStatus, setFriendshipStatus] = useState<string>('none')
  const [checkingStatus, setCheckingStatus] = useState(false)
  const isFetchingRef = useRef(false)
  const currentPageRef = useRef(0)

  useEffect(() => {
    if (username && typeof username === 'string') {
      fetchPosts(username, 0, true)
    }
  }, [username])

  useEffect(() => {
    if (profileUser && currentUser && currentUser.id !== profileUser.id) {
      fetchFriendshipStatus()
    }
  }, [profileUser, currentUser])

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
          // Set profile user from first post
          if (newPosts.length > 0 && newPosts[0].user) {
            setProfileUser(newPosts[0].user)
            setFriendshipStatus('none') // Reset status when user changes
          }
        } else {
          setPosts(prev => [...prev, ...newPosts])
        }

        const pageNumber = data.pageable?.pageNumber || 0
        setCurrentPage(pageNumber)
        currentPageRef.current = pageNumber
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
      isFetchingRef.current = false
    }
  }

  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore && username && typeof username === 'string' && !isFetchingRef.current) {
      isFetchingRef.current = true
      const nextPage = currentPageRef.current + 1
      fetchPosts(username, nextPage, false).finally(() => {
        isFetchingRef.current = false
      })
    }
  }, [loadingMore, hasMore, username])

  const handleSendFriendRequest = async () => {
    if (!profileUser || !currentUser) return

    setSendingRequest(true)
    try {
      const res = await sendFriendRequest(profileUser.id)
      if (res.ok) {
        alert('Friend request sent!')
        // Refresh status after sending
        fetchFriendshipStatus()
      } else {
        alert('Failed to send friend request: ' + (res.body?.message || 'Unknown error'))
      }
    } catch (error) {
      alert('Failed to send friend request')
    } finally {
      setSendingRequest(false)
    }
  }

  const fetchFriendshipStatus = async () => {
    if (!profileUser || !currentUser) return

    setCheckingStatus(true)
    try {
      const res = await checkFriendshipStatus(profileUser.id)
      if (res.ok && res.body?.data) {
        setFriendshipStatus(res.body.data.status)
      }
    } catch (error) {
      console.error('Failed to check friendship status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const handleScroll = () => {
      if (timeoutId) return // Debounce

      timeoutId = setTimeout(() => {
        if (isFullscreen || isFetchingRef.current || !hasMore || loadingMore) {
          timeoutId = null
          return
        }

        const scrollTop = window.scrollY
        const windowHeight = window.innerHeight
        const documentHeight = document.documentElement.scrollHeight

        // Trigger when user is within 200px of bottom
        if (scrollTop + windowHeight >= documentHeight - 200) {
          loadMorePosts()
        }

        timeoutId = null
      }, 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [loadMorePosts, hasMore, loadingMore, isFullscreen])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Posts by @{username}
            </h1>
            <p className="text-gray-600">
              {posts.length} post{posts.length !== 1 ? 's' : ''} loaded
              {totalElements > 0 && ` (${totalElements} total)`}
            </p>
          </div>
          {currentUser && profileUser && currentUser.id !== profileUser.id && (
            <button
              onClick={friendshipStatus === 'none' ? handleSendFriendRequest : undefined}
              disabled={sendingRequest || checkingStatus || friendshipStatus !== 'none'}
              className={`px-4 py-2 my-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                friendshipStatus === 'accepted'
                  ? 'bg-green-600 text-white'
                  : friendshipStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : friendshipStatus === 'blocked'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {checkingStatus
                ? 'Checking...'
                : sendingRequest
                ? 'Sending...'
                : friendshipStatus === 'accepted'
                ? 'Friends'
                : friendshipStatus === 'pending'
                ? 'Request Sent'
                : friendshipStatus === 'blocked'
                ? 'Blocked'
                : 'Add Friend'}
            </button>
          )}
        </div>
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
        <div className="flex justify-center items-center py-8">
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
  )
}