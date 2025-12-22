import { useEffect, useState, useRef } from 'react'
import { getPublishedNews } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { News, Pageable } from '../types'
import NewsItem from '../components/NewsItem'

export default function NewsPage() {
  const { user, loading } = useAuth()
  const { t } = useLocale()
  const [news, setNews] = useState<News[]>([])
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
      const res = await getPublishedNews(pageToLoad, size)
      if (res.ok && res.body?.statusCode === 2000) {
        const items = res.body.data.content || []
        if (pageToLoad === 0) setNews(items)
        else setNews(prev => [...prev, ...items])
        setPageable(res.body.data.pageable || null)
      } else {
        setError('Failed to load news')
      }
    } catch (err) {
      setError('Failed to load news')
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
        <h1 className="text-2xl font-bold mb-6">{t('news')}</h1>

        {error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : news.length > 0 ? (
          <ul className="space-y-4">
            {news.map(item => (
              <NewsItem key={item.public_id} news={item} />
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {t('no_more')}
          </div>
        )}
        <div className="mt-4 text-center text-sm text-gray-600">
          {loadingMore ? t('loading') : (pageable && pageable.pageNumber+1 >= pageable.totalPages ? t('no_more') || 'No more news' : '')}
        </div>
      </main>
    </div>
  )
}