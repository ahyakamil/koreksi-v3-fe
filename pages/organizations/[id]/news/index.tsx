import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Organization, Space, News } from '../../../../types'
import { getOrganization, getSpaces, getNews, reviewNews, deleteNews } from '../../../../utils/api'
import { useAuth } from '../../../../context/AuthContext'

const NewsManagementPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'need_review' | 'published' | 'rejected'>('all')
  const { user } = useAuth()
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
      const [orgRes, spacesRes, newsRes] = await Promise.all([
        getOrganization(id as string),
        getSpaces(id as string),
        getNews(id as string)
      ])

      if (orgRes.ok) setOrganization(orgRes.body.data.organization)
      if (spacesRes.ok) setSpaces(spacesRes.body.data.spaces)
      if (newsRes.ok) setNews(newsRes.body.data.news)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }

  const handleReview = async (newsId: string, action: 'publish' | 'reject') => {
    if (!organization) return
    let reviewNotes: string | undefined = undefined
    if (action === 'reject') {
      const notes = prompt('Enter rejection reason:')
      if (!notes) return
      reviewNotes = notes
    }

    const res = await reviewNews(organization.id, newsId, { action, review_notes: reviewNotes })
    if (res.ok) {
      fetchData() // Refresh data
    } else {
      alert(res.body.message || 'Failed to review news')
    }
  }

  const handleDelete = async (newsId: string) => {
    if (!organization) return
    if (!confirm('Are you sure you want to delete this news?')) return

    const res = await deleteNews(organization.id, newsId)
    if (res.ok) {
      setNews(news.filter(n => n.id !== newsId))
    } else {
      alert(res.body.message || 'Failed to delete news')
    }
  }

  const getCurrentUserRole = () => {
    return organization?.users?.find(u => u.id === user?.id)?.pivot?.role
  }

  const filteredNews = news.filter(item => {
    if (activeTab === 'all') return true
    return item.status === activeTab
  })

  if (loading) return <div>Loading...</div>
  if (!organization) return <div>Organization not found</div>

  const currentUserRole = getCurrentUserRole()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.push(`/organizations/${id}`)}
          className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Organization
        </button>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage News - {organization.title}</h1>
          {currentUserRole && (
            <button
              onClick={() => router.push(`/organizations/${id}/news/create`)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Create News
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { key: 'all', label: 'All' },
              { key: 'draft', label: 'Draft' },
              { key: 'need_review', label: 'Need Review' },
              { key: 'published', label: 'Published' },
              { key: 'rejected', label: 'Rejected' }
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
          <p className="text-gray-500">No news found in this category.</p>
        ) : (
          filteredNews.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <div className="text-sm text-gray-600 mb-2">
                    <span>By {item.user?.name}</span>
                    <span className="mx-2">•</span>
                    <span>In {item.space?.name}</span>
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
                        <strong>Review Notes:</strong> {item.review_notes}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {item.user_id === user?.id && (
                    <button
                      onClick={() => router.push(`/organizations/${id}/news/${item.id}/edit`)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  )}
                  {(currentUserRole === 'admin' || currentUserRole === 'editor') && item.status === 'need_review' && (
                    <>
                      <button
                        onClick={() => handleReview(item.id, 'publish')}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => handleReview(item.id, 'reject')}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {item.user_id === user?.id && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NewsManagementPage