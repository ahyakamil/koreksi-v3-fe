import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { apiFetch } from '../utils/api'
import PostForm from '../components/PostForm'
import Carousel from '../components/Carousel'
import { useAuth } from '../context/AuthContext'
import CommentsList from '../components/CommentsList'
import { formatDate } from '../utils/format'
import { useLocale } from '../context/LocaleContext'
import { Post, Pageable, Media } from '../types'

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
                <li key={p.public_id} className="p-4 bg-white rounded shadow">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">by {p.user?.name || t('unknown')}</div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-gray-400">{formatDate(p.created_at)}</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin + '/post/' + p.public_id)
                          alert('URL copied to clipboard!')
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    {p.title && <h3 className="font-semibold">{p.title}</h3>}
                    <div className="mt-1">{p.content}</div>
                    {p.medias && <Carousel medias={p.medias} />}
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
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-gray-400">{formatDate(p.created_at)}</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin + '/post/' + p.public_id)
                          alert('URL copied to clipboard!')
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    {p.title && <h3 className="font-semibold">{p.title}</h3>}
                    <div className="mt-1">{p.content}</div>
                    {p.medias && <Carousel medias={p.medias} />}
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

