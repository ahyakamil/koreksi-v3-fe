import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Organization, Space, News } from '../../../../types'
import { getOrganization, getSpace, getSpaceNews } from '../../../../utils/api'
import { useAuth } from '../../../../context/AuthContext'
import { useLocale } from '../../../../context/LocaleContext'
import NewsItem from '../../../../components/NewsItem'

const SpaceDetailPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [space, setSpace] = useState<Space | null>(null)
  const [news, setNews] = useState<News[]>([])
  const [pageable, setPageable] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const { user } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const { id, spaceId } = router.query

  useEffect(() => {
    if (id && spaceId && user) {
      fetchData()
    }
  }, [id, spaceId, user])

  const fetchData = async () => {
    if (!id || !spaceId) return

    // Fetch organization
    const orgRes = await getOrganization(id as string)
    if (orgRes.ok) {
      setOrganization(orgRes.body.data.organization)
    }

    // Fetch the specific space
    const spaceRes = await getSpace(id as string, spaceId as string)
    if (spaceRes.ok && spaceRes.body.data) {
      setSpace(spaceRes.body.data.space)
    }

    // Fetch news for space
    const newsRes = await getSpaceNews(id as string, spaceId as string)
    if (newsRes.ok && newsRes.body && newsRes.body.data) {
      setNews(newsRes.body.data.content || [])
      setPageable(newsRes.body.data.pageable)
    } else {
      setNews([])
      setPageable(null)
    }

    setLoading(false)
  }

  const loadMoreNews = async () => {
    if (!pageable || loadingMore) return
    const nextPage = pageable.pageNumber + 1
    if (nextPage >= pageable.totalPages) return

    setLoadingMore(true)
    const newsRes = await getSpaceNews(id as string, spaceId as string, nextPage)
    if (newsRes.ok) {
      setNews(prev => [...prev, ...newsRes.body.data.content])
      setPageable(newsRes.body.data.pageable)
    }
    setLoadingMore(false)
  }

  if (!user) return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">{t('login_required')}</h3>
        <p className="text-blue-700 mb-4">
          {t('please_login_to_view_this_page')}
        </p>
        <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          {t('login')}
        </Link>
      </div>
    </div>
  )
  if (loading) return <div>{t('loading')}</div>
  if (!organization || !space) return <div>{t('not_found')}</div>

  return (
    <div className="container mx-auto px-4">
      <div className="mb-8">
        <Link href={`/organizations/${id}`}>
          <h1 className="text-3xl font-bold text-blue-600 hover:text-blue-800 cursor-pointer">{organization?.title}</h1>
        </Link>
        <h2 className="text-2xl font-semibold mt-2">{space.name}</h2>
        {space.description && (
          <p className="text-gray-600 mt-2">{space.description}</p>
        )}
        {space.image && (
          <img src={space.image} alt={space.name} className="w-full h-48 object-contain rounded-lg mt-4" />
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">{t('news')}</h2>
        {news.length === 0 ? (
          <p>{t('no_news_available')}</p>
        ) : (
          <>
            <ul className="space-y-4">
              {news.map(item => (
                <NewsItem key={item.public_id} news={item} hideOrganization={false} />
              ))}
            </ul>
            {pageable && pageable.pageNumber + 1 < pageable.totalPages && (
              <div className="text-center mt-4">
                <button
                  onClick={loadMoreNews}
                  disabled={loadingMore}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingMore ? t('loading') : t('load_more')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SpaceDetailPage