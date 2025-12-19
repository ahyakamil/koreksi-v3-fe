import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { apiFetch } from '../utils/api'
import PostForm from '../components/PostForm'
import { useAuth } from '../context/AuthContext'
import CommentsList from '../components/CommentsList'
import { formatDate } from '../utils/format'
import { useLocale } from '../context/LocaleContext'
import { Post, Pageable } from '../types'

export default function Home() {
  const { user, loading } = useAuth()
  const { t } = useLocale()
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [pageable, setPageable] = useState<Pageable | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
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
            <PostForm onCreated={() => { setPage(0); load(0) }} />
            <ul className="space-y-4">
              {posts.map(p => (
                <li key={p.public_id} className="p-4 bg-white rounded shadow">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">by {p.user?.name || t('unknown')}</div>
                    <div className="text-xs text-gray-400">{formatDate(p.created_at)}</div>
                  </div>
                  <div className="mt-2">
                    {p.title && <h3 className="font-semibold">{p.title}</h3>}
                    <div className="mt-1">{p.content}</div>
                    {p.image && <img src={p.image} alt="Post image" className="mt-2 max-w-full h-auto rounded" />}
                  </div>
                  <div className="mt-3">
                    <CommentsList postId={p.public_id} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-center text-sm text-gray-600">
              {loadingMore ? t('loading') : (pageable && pageable.pageNumber+1 >= pageable.totalPages ? t('no_more') || 'No more posts' : t('loading'))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-medium mb-2">{t('public_posts')}</h2>
            <ul className="space-y-4">
              {posts.map(p => (
                <li key={p.public_id} className="p-4 bg-white rounded shadow">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">by {p.user?.name || t('unknown')}</div>
                    <div className="text-xs text-gray-400">{formatDate(p.created_at)}</div>
                  </div>
                  <div className="mt-2">
                    {p.title && <h3 className="font-semibold">{p.title}</h3>}
                    <div className="mt-1">{p.content}</div>
                    {p.image && <img src={p.image} alt="Post image" className="mt-2 max-w-full h-auto rounded" />}
                  </div>
                  <div className="mt-3">
                    <CommentsList postId={p.public_id} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-center text-sm text-gray-600">{loadingMore ? t('loading') : (pageable && pageable.pageNumber+1 >= pageable.totalPages ? t('no_more') || 'No more posts' : '')}</div>
          </div>
        )}
        
      </main>
    </div>
  )
}

