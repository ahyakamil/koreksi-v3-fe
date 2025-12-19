import { useEffect, useState, useRef } from 'react'
import { getPublishedNews } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { News } from '../types'
import NewsItem from '../components/NewsItem'

export default function NewsPage() {
  const { user, loading } = useAuth()
  const { t } = useLocale()
  const [news, setNews] = useState<News[]>([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(false)

  async function loadNews() {
    setLoadingNews(true)
    setError(null)
    try {
      const res = await getPublishedNews()
      if (res.ok && res.body?.data?.news) {
        setNews(res.body.data.news)
      } else {
        setError('Failed to load news')
      }
    } catch (err) {
      setError('Failed to load news')
    }
    setLoadingNews(false)
  }

  useEffect(() => {
    if (!mountedRef.current) {
      loadNews()
      mountedRef.current = true
    }
  }, [])

  if (loadingNews) {
    return (
      <div className="container py-8">
        <div>{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <main>
        <h1 className="text-2xl font-bold mb-6">Published News</h1>

        {loadingNews ? (
          <div className="text-center py-8">{t('loading')}</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : news.length > 0 ? (
          <ul className="space-y-4">
            {news.map(item => (
              <NewsItem key={item.public_id} news={item} />
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No published news available.
          </div>
        )}
      </main>
    </div>
  )
}