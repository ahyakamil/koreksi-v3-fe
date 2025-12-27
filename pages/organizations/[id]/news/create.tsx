import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Organization, Space } from '../../../../types'
import { getOrganization, getSpaces, createNews, uploadImage, createSpace } from '../../../../utils/api'
import { useAuth } from '../../../../context/AuthContext'
import { useLocale } from '../../../../context/LocaleContext'
import RichTextEditor from '../../../../components/RichTextEditor'
import ImageUpload from '../../../../components/ImageUpload'
import SpaceForm from '../../../../components/SpaceForm'

const CreateNewsPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCreateSpace, setShowCreateSpace] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    caption: '',
    space_id: '',
    status: 'draft' as 'draft' | 'need_review'
  })
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
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
      setSpaces(spacesRes.ok ? spacesRes.body.data.content : [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }

  const handleCreateSpace = async (data: { name: string; description?: string; image?: string }) => {
    if (!organization) return
    const res = await createSpace(organization.id, data)
    if (res.ok) {
      setSpaces([...spaces, res.body.data.space])
      setShowCreateSpace(false)
    } else {
      alert(res.body.message || t('failed_to_create_space'))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization) return

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
        alert(t('failed_to_upload_image'))
        setSubmitting(false)
        return
      }
    }

    const newsData = {
      ...formData,
      image: imageUrl
    }

    const res = await createNews(organization.id, newsData)
    setSubmitting(false)

    if (res.ok) {
      router.push(`/organizations/${id}/news`)
    } else {
      alert(res.body.message || t('failed_to_create_news'))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const getCurrentUserRole = () => {
    return organization?.users?.find(u => u.id === user?.id)?.pivot?.role
  }

  if (loading) return <div>{t('loading')}</div>
  if (!organization) return <div>{t('organization_not_found')}</div>

  const currentUserRole = getCurrentUserRole()

  if (!currentUserRole || !['admin', 'editor', 'author'].includes(currentUserRole)) {
    return <div>{t('you_do_not_have_permission')}</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.push(`/organizations/${id}/news`)}
          className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          {t('back_to_news')}
        </button>
        <h1 className="text-3xl font-bold">{t('create_news')} - {organization.title}</h1>
      </div>

      {(!spaces || spaces.length === 0) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">{t('create_space')}</h2>
            <p className="text-gray-600 mb-4">{t('no_spaces_found_create_first')}</p>
            <SpaceForm
              onSubmit={handleCreateSpace}
              onCancel={() => router.push(`/organizations/${id}/news`)}
            />
          </div>
        </div>
      )}

      {spaces && spaces.length > 0 && (
        <div className="max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('title')} *
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
              {t('space')} *
            </label>
            <select
              name="space_id"
              value={formData.space_id}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">{t('select_a_space')}</option>
              {spaces?.map(space => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          <ImageUpload
            onFileSelected={setSelectedImageFile}
            currentImage={formData.image}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('caption')}
            </label>
            <input
              type="text"
              name="caption"
              value={formData.caption}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('optional_caption_for_the_image')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('content')} *
            </label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
              placeholder={t('write_your_news_content_here')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('status')}
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
                <span className="text-sm">{t('save_as_draft')}</span>
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
                <span className="text-sm">{t('submit_for_review')}</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('creating') : t('create_news_button')}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/organizations/${id}/news`)}
              className="bg-gray-500 text-white px-6 py-3 rounded hover:bg-gray-600"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
      )}
    </div>
  )
}

export default CreateNewsPage