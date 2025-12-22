import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { Organization, Space, News } from '../../../../types'
import { getOrganization, getSpaces, getNews, reviewNews, deleteNews } from '../../../../utils/api'
import { useAuth } from '../../../../context/AuthContext'
import { useLocale } from '../../../../context/LocaleContext'

const NewsManagementPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'need_review' | 'published' | 'rejected'>('all')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastNewsElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreNews()
      }
    })
    if (node) observerRef.current.observe(node)
  }, [loadingMore, hasMore])
  const { user } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id && user) {
      fetchData()
    }
  }, [id, user])

  const fetchData = async () => {
    if (!id) return
    try {
      const [orgRes, spacesRes] = await Promise.all([
        getOrganization(id as string),
        getSpaces(id as string)
      ])

      if (orgRes.ok) setOrganization(orgRes.body.data.organization)
      if (spacesRes.ok) setSpaces(spacesRes.body.data.spaces)

      // Load first page of news
      setNews([])
      setPage(0)
      setHasMore(false)
      const newsRes = await getNews(id as string, 0, 10)
      if (newsRes.ok && newsRes.body.data.content) {
        setNews(newsRes.body.data.content)
        const pageable = newsRes.body.data.pageable
        setHasMore(pageable.pageNumber + 1 < pageable.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }

  const loadMoreNews = async () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    const newsRes = await getNews(id as string, nextPage, 10)
    if (newsRes.ok && newsRes.body.data.content) {
      setNews(prev => [...prev, ...newsRes.body.data.content])
      setPage(nextPage)
      const pageable = newsRes.body.data.pageable
      setHasMore(pageable.pageNumber + 1 < pageable.totalPages)
    }
    setLoadingMore(false)
  }

  const handleReview = async (newsId: string, action: 'publish' | 'reject') => {
    if (!organization) return
    let reviewNotes: string | undefined = undefined
    if (action === 'reject') {
      const notes = prompt(t('enter_rejection_reason'))
      if (!notes) return
      reviewNotes = notes
    }

    const res = await reviewNews(organization.id, newsId, { action, review_notes: reviewNotes })
    if (res.ok) {
      fetchData() // Refresh data
    } else {
      alert(res.body.message || t('failed_to_review_news'))
    }
  }

  const handleDelete = async (newsId: string) => {
    if (!organization) return
    if (!confirm(t('are_you_sure_delete_news'))) return

    const res = await deleteNews(organization.id, newsId)
    if (res.ok) {
      setNews(news.filter(n => n.public_id !== newsId))
    } else {
      alert(res.body.message || t('failed_to_delete_news'))
    }
  }

  const getCurrentUserRole = () => {
    return organization?.users?.find(u => u.id === user?.id)?.pivot?.role
  }

  const filteredNews = news.filter(item => {
    if (activeTab === 'all') return true
    return item.status === activeTab
  })

  if (loading) return <div>{t('loading')}</div>
  if (!organization) return <div>{t('organization_not_found')}</div>

  const currentUserRole = getCurrentUserRole()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.push(`/organizations/${id}`)}
          className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          {t('back_to_organization')}
        </button>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t('manage_news')} - {organization.title}</h1>
          {currentUserRole && (
            <button
              onClick={() => router.push(`/organizations/${id}/news/create`)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {t('create_news')}
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { key: 'all', label: t('all') },
              { key: 'draft', label: t('draft') },
              { key: 'need_review', label: t('need_review') },
              { key: 'published', label: t('published') },
              { key: 'rejected', label: t('rejected') }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <p className="text-gray-500">{t('no_news_found_in_this_category')}</p>
        ) : (
          <>
            {filteredNews.map((item, index) => (
              <div
                key={item.public_id}
                ref={index === filteredNews.length - 1 ? lastNewsElementRef : null}
                className="bg-white p-6 rounded-lg shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <div className="text-sm text-gray-600 mb-2">
                      <span>{t('by')} {item.user?.name}</span>
                      <span className="mx-2">•</span>
                      <span>{t('in')} {item.space?.name}</span>
                      <span className="mx-2">•</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.status === 'published' ? 'bg-green-100 text-green-800' :
                        item.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        item.status === 'need_review' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 line-clamp-3" dangerouslySetInnerHTML={{ __html: item.content.substring(0, 300) + '...' }} />
                    {item.review_notes && (
                      <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-400">
                        <p className="text-sm text-red-700">
                          <strong>{t('review_notes')}:</strong> {item.review_notes}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {((item.user_id === user?.id && item.status !== 'published') || currentUserRole === 'admin' || currentUserRole === 'editor') && (
                        <button
                          onClick={() => router.push(`/organizations/${id}/news/${item.public_id}/edit`)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          {t('edit')}
                        </button>
                      )}
                      {(currentUserRole === 'admin' || currentUserRole === 'editor') && item.status === 'need_review' && (
                        <>
                          <button
                            onClick={() => handleReview(item.public_id, 'publish')}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            {t('publish')}
                          </button>
                          <button
                            onClick={() => handleReview(item.public_id, 'reject')}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            {t('reject')}
                          </button>
                        </>
                      )}
                      {(currentUserRole === 'admin' || currentUserRole === 'editor') && item.status !== 'need_review' && (
                        <button
                          onClick={() => handleReview(item.public_id, 'reject')}
                          className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                          title="Reject this news"
                        >
                          Reject
                        </button>
                      )}
                      {((item.user_id === user?.id && item.status !== 'published') || currentUserRole === 'admin' || currentUserRole === 'editor') && (
                        <button
                          onClick={() => handleDelete(item.public_id)}
                          className="bg-red-700 text-white px-3 py-1 rounded text-sm hover:bg-red-800"
                        >
                          {t('delete')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {loadingMore && (
              <div className="text-center mt-6">
                <div className="text-gray-500">{t('loading')}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default NewsManagementPage