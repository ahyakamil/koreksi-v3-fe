import { useEffect, useState, useRef } from 'react'
import { apiFetch } from '../utils/api'
import PostForm from '../components/PostForm'
import { useAuth } from '../context/AuthContext'
import CommentsList from '../components/CommentsList'
import { useLocale } from '../context/LocaleContext'
import { Post, Pageable } from '../types'
import PostItem from '../components/PostItem'

export default function Home() {
  const { user, loading } = useAuth()
  const { t } = useLocale()
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [pageable, setPageable] = useState<Pageable | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showPostForm, setShowPostForm] = useState(false)
  const mountedRef = useRef(false)
  const isFetchingRef = useRef(false)
  const initialLoadedRef = useRef(false)

  async function load(pageToLoad = 0){
    if (pageToLoad > 0) { setLoadingMore(true); isFetchingRef.current = true }
    const res = await apiFetch(`/posts?page=${pageToLoad}&size=${size}`)
    if (res.body && res.body.statusCode === 2000) {
      const items = res.body.data.content || []
      if (pageToLoad === 0) setPosts(items)
      else setPosts(prev => [...prev, ...items])
      setPageable(res.body.data.pageable || null)
    }
    setLoadingMore(false)
    isFetchingRef.current = false
  }

  useEffect(() => {
    if (!initialLoadedRef.current) {
      load(0)
      initialLoadedRef.current = true
    }
    mountedRef.current = true
  }, [size])

  useEffect(() => {
    // when page increments (not initial), load next page
    if (!mountedRef.current) return
    if (page === 0) return
    load(page)
  }, [page])

  // infinite scroll listener: when near bottom and not fetching, increment page
  useEffect(()=>{
    function onScroll(){
      try{
        if (isFetchingRef.current) return
        if (!pageable) return
        const hasMore = (pageable.pageNumber + 1) < pageable.totalPages
        if (!hasMore) return
        if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 400)){
          // increment page to trigger load
          setPage(p=>p+1)
        }
      }catch(e){}
    }
    window.addEventListener('scroll', onScroll)
    return ()=> window.removeEventListener('scroll', onScroll)
  }, [pageable])

  return (
    <div className="container py-8">
      <main>
        {loading ? (
          <div>{t('loading')}</div>
        ) : user ? (
          <>
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setShowPostForm(!showPostForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <svg className={`w-5 h-5 transition-transform ${showPostForm ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{showPostForm ? t('hide_post_form') : t('show_post_form')}</span>
              </button>
            </div>
            {showPostForm && <PostForm onCreated={() => { setPage(0); load(0); setShowPostForm(false) }} />}
            <ul className="space-y-4">
              {posts.map(p => (
                <PostItem key={p.public_id} post={p} />
              ))}
            </ul>
            <div className="mt-4 text-center text-sm text-gray-600">
              {loadingMore ? t('loading') : (pageable && pageable.pageNumber+1 >= pageable.totalPages ? t('no_more') || 'No more posts' : t('loading'))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-medium mb-2">{t('news')}</h2>
            <ul className="space-y-4">
              {posts.map(p => (
                <PostItem key={p.public_id} post={p} />
              ))}
            </ul>
            <div className="mt-4 text-center text-sm text-gray-600">{loadingMore ? t('loading') : (pageable && pageable.pageNumber+1 >= pageable.totalPages ? t('no_more') || 'No more posts' : '')}</div>
          </div>
        )}
        
      </main>
    </div>
  )
}

