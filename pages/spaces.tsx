import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import { getAllSpaces } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { Space, Pageable } from '../types'
import SpaceItem from '../components/SpaceItem'

export default function SpacesPage() {
  const { user, loading } = useAuth()
  const { t } = useLocale()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [pageable, setPageable] = useState<Pageable | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(false)
  const isFetchingRef = useRef(false)
  const initialLoadedRef = useRef(false)

  async function load(pageToLoad = 0){
    if (pageToLoad > 0) { setLoadingMore(true); isFetchingRef.current = true }
    setError(null)
    try {
      const res = await getAllSpaces(pageToLoad, size)
      if (res.ok && res.body?.statusCode === 2000) {
        const items = res.body.data.content || []
        if (pageToLoad === 0) setSpaces(items)
        else setSpaces(prev => [...prev, ...items])
        setPageable(res.body.data.pageable || null)
      } else {
        setError('Failed to load spaces')
      }
    } catch (err) {
      setError('Failed to load spaces')
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
        <title>Spaces - Koreksi.org</title>
        <meta name="description" content="Explore spaces from organizations on Koreksi.org - Social media for journalism." />
        <meta property="og:title" content="Spaces - Koreksi.org" />
        <meta property="og:description" content="Explore spaces from organizations on Koreksi.org - Social media for journalism." />
        <meta property="og:url" content="https://koreksi.org/spaces" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Koreksi.org" />
      </Head>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Spaces</h1>
        {error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : spaces.length > 0 ? (
          spaces.map(space => (
            <SpaceItem key={space.id} space={space} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {t('no_more')}
          </div>
        )}
        <div className="text-center py-8">
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={loadingMore || (pageable ? pageable.pageNumber + 1 >= pageable.totalPages : false)}
            className="px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingMore ? t('loading') : 'Load more spaces'}
          </button>
        </div>
      </div>
    </>
  )
}