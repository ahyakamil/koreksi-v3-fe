import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Organization, Space, News } from '../../../../../types'
import { getOrganization, getSpaces, getSingleNews, updateNews, uploadImage, checkOrganizationMembership, getSpaceMaxPageNumber } from '../../../../../utils/api'
import { useAuth } from '../../../../../context/AuthContext'
import { useLocale } from '../../../../../context/LocaleContext'
import RichTextEditor from '../../../../../components/RichTextEditor'
import ImageUpload from '../../../../../components/ImageUpload'
import { Back } from '@/components/Back'

const EditNewsPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [news, setNews] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    caption: '',
    space_id: '',
    page_number: '',
    status: 'draft' as 'draft' | 'need_review' | 'published'
  })
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const [maxPageNumber, setMaxPageNumber] = useState<number>(0)
  const { user } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const { id, newsId } = router.query

  useEffect(() => {
    if (id && newsId && user) {
      fetchData()
    }
  }, [id, newsId, user])

  const fetchData = async () => {
    if (!id || !newsId) return
    setUserRole(null)
    try {
      const [orgRes, spacesRes, newsRes] = await Promise.all([
        getOrganization(id as string),
        getSpaces(id as string),
        getSingleNews(id as string, newsId as string)
      ])

      if (orgRes.ok) setOrganization(orgRes.body.data.organization)
      setSpaces(spacesRes.ok ? spacesRes.body.data.content : [])
      if (newsRes.ok) {
        const newsData = newsRes.body.data.news
        setNews(newsData)
        setFormData({
          title: newsData.title,
          content: newsData.content,
          image: newsData.image || '',
          caption: newsData.caption || '',
          space_id: newsData.space_id,
          page_number: newsData.page_number ? newsData.page_number.toString() : '',
          status: newsData.status === 'rejected' ? 'draft' : newsData.status
        })
        fetchMaxPageNumber(newsData.space_id)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
    await fetchCurrentUserRole()
  }

  const fetchCurrentUserRole = async () => {
    if (!id) return
    const res = await checkOrganizationMembership(id as string)
    if (res.ok) {
      setUserRole(res.body.data.role)
    }
    setRoleLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization || !news) return

    setSubmitting(true)

    let imageUrl = formData.image

    // Upload image if selected
    if (selectedImageFile) {
      const formDataUpload = new FormData()
      formDataUpload.append('image', selectedImageFile)

      const uploadRes = await uploadImage(formDataUpload)
      if (uploadRes.ok) {
        imageUrl = uploadRes.body.data.url
      } else {
        alert('Failed to upload image')
        setSubmitting(false)
        return
      }
    }

    const newsData = {
      ...formData,
      content: formData.content.replace(/&nbsp;/g, ' '),
      image: imageUrl,
      page_number: formData.page_number ? parseInt(formData.page_number) : undefined
    }

    const res = await updateNews(organization.id, news.public_id, newsData)
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

    if (name === 'space_id' && value) {
      fetchMaxPageNumber(value)
    }
  }

  const fetchMaxPageNumber = async (spaceId: string) => {
    if (!id) return
    const res = await getSpaceMaxPageNumber(id as string, spaceId)
    if (res.ok) {
      setMaxPageNumber(res.body.data.max_page_number)
    }
  }

  const getCurrentUserRole = () => {
    return userRole
  }

  const canEditNews = () => {
    if (!news || !user) return false
    const role = getCurrentUserRole()
    return (news.user_id === user.id && news.status !== 'published') || role === 'admin' || role === 'editor'
  }

  const canPublishNews = () => {
    const role = getCurrentUserRole()
    return role === 'admin' || role === 'editor'
  }

  if (loading) return <div>Loading...</div>
  if (!organization || !news) return <div>Not found</div>

  if (roleLoading) return <div>Loading...</div>

  if (!canEditNews()) {
    return <div>You don't have permission to edit this news.</div>
  }

  return (
    <div>
      <div className="mb-8">
        <Back />
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
              {spaces?.map(space => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Number
            </label>
            <input
              type="number"
              name="page_number"
              value={formData.page_number}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional page number for ordering"
              min="1"
            />
            {maxPageNumber > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {t('latest_page_number_used')}: {maxPageNumber}
              </p>
            )}
          </div>

          <ImageUpload
            onFileSelected={setSelectedImageFile}
            currentImage={formData.image}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption
            </label>
            <input
              type="text"
              name="caption"
              value={formData.caption}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional caption for the image"
            />
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
              {canPublishNews() && (
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={formData.status === 'published'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm">Published</span>
                </label>
              )}
            </div>
          </div>

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