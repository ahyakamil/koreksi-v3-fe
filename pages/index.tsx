import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import { apiFetch } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { Post, Pageable } from '../types'
import { CreatePost } from '../components/CreatePost'
import { Post as PostComponent } from '../components/Post'

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
    <>
      <Head>
        <title>Koreksi.org - Sosial Media Jurnalisme</title>
        <meta name="description" content="Sosial media jurnalisme karya anak bangsa. Ayo bergabung di koreksi.org! Di sini kamu bisa membuat organisasi sendiri, mengelola dan mempublikasikan beritamu dengan mudah. Terhubunglah dengan teman-teman, bangun komunitas, dan lakukan lebih banyak hal menarik lainnya. Gabung sekarang, dan koreksi apa yang perlu dikoreksi." />
        <meta property="og:title" content="Koreksi.org - Sosial Media Jurnalisme" />
        <meta property="og:description" content="Sosial media jurnalisme karya anak bangsa. Ayo bergabung di koreksi.org! Di sini kamu bisa membuat organisasi sendiri, mengelola dan mempublikasikan beritamu dengan mudah. Terhubunglah dengan teman-teman, bangun komunitas, dan lakukan lebih banyak hal menarik lainnya. Gabung sekarang, dan koreksi apa yang perlu dikoreksi." />
        <meta property="og:url" content="https://koreksi.org" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Koreksi.org" />
      </Head>
      {loading ? (
        <div>{t('loading')}</div>
      ) : user ? (
        <>
          <CreatePost onCreated={() => { setPage(0); load(0) }} />
          {posts.map(p => (
            <PostComponent
              key={p.public_id}
              post={p}
            />
          ))}
          <div className="text-center py-8">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loadingMore || (pageable ? pageable.pageNumber + 1 >= pageable.totalPages : false)}
              className="px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {loadingMore ? t('loading') : 'Load more posts'}
            </button>
          </div>
        </>
      ) : (
        <>
          {posts.map(p => (
            <PostComponent
              key={p.public_id}
              post={p}
            />
          ))}
          <div className="text-center py-8">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loadingMore || (pageable ? pageable.pageNumber + 1 >= pageable.totalPages : false)}
              className="px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {loadingMore ? t('loading') : 'Load more posts'}
            </button>
          </div>
        </>
      )}
    </>
  )
}

