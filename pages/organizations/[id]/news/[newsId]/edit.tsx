import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Organization, Space, News } from '../../../../../types'
import { getOrganization, getSpaces, getSingleNews, updateNews } from '../../../../../utils/api'
import { useAuth } from '../../../../../context/AuthContext'
import RichTextEditor from '../../../../../components/RichTextEditor'

const EditNewsPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [news, setNews] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    space_id: '',
    status: 'draft' as 'draft' | 'need_review'
  })
  const { user } = useAuth()
  const router = useRouter()
  const { id, newsId } = router.query

  useEffect(() => {
    if (id && newsId && user) {
      fetchData()
    }
  }, [id, newsId, user])

  const fetchData = async () => {
    if (!id || !newsId) return
    try {
      const [orgRes, spacesRes, newsRes] = await Promise.all([
        getOrganization(id as string),
        getSpaces(id as string),
        getSingleNews(id as string, newsId as string)
      ])

      if (orgRes.ok) setOrganization(orgRes.body.data.organization)
      if (spacesRes.ok) setSpaces(spacesRes.body.data.spaces)
      if (newsRes.ok) {
        const newsData = newsRes.body.data.news
        setNews(newsData)
        setFormData({
          title: newsData.title,
          content: newsData.content,
          space_id: newsData.space_id,
          status: newsData.status === 'draft' || newsData.status === 'need_review' ? newsData.status : 'draft'
        })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization || !news) return

    setSubmitting(true)
    const res = await updateNews(organization.id, news.id, formData)
    setSubmitting(false)

    if (res.ok) {
      router.push(`/organizations/${id}/news`)
    } else {
      alert(res.body.message || 'Failed to update news')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const getCurrentUserRole = () => {
    return organization?.users?.find(u => u.id === user?.id)?.pivot?.role
  }

  const canEditNews = () => {
    if (!news || !user) return false
    return news.user_id === user.id
  }

  if (loading) return <div>Loading...</div>
  if (!organization || !news) return <div>Not found</div>

  if (!canEditNews()) {
    return <div>You don't have permission to edit this news.</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.push(`/organizations/${id}/news`)}
          className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to News
        </button>
        <h1 className="text-3xl font-bold">Edit News - {organization.title}</h1>
      </div>

      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Space *
            </label>
            <select
              name="space_id"
              value={formData.space_id}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a space</option>
              {spaces.map(space => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
              placeholder="Write your news content here..."
            />
          </div>

          {(news.status === 'draft' || news.status === 'rejected') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={formData.status === 'draft'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm">Save as Draft</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="need_review"
                    checked={formData.status === 'need_review'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm">Submit for Review</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating...' : 'Update News'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/organizations/${id}/news`)}
              className="bg-gray-500 text-white px-6 py-3 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditNewsPage