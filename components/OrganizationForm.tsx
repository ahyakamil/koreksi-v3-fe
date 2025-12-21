import React, { useState } from 'react'
import { Organization } from '../types'
import ImageUpload from './ImageUpload'
import { uploadImage } from '../utils/api'
import { useLocale } from '../context/LocaleContext'

interface OrganizationFormProps {
  organization?: Organization
  onSubmit: (data: { title: string; description?: string; image?: string }) => void
  onCancel: () => void
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({
  organization,
  onSubmit,
  onCancel
}) => {
  const [title, setTitle] = useState(organization?.title || '')
  const [description, setDescription] = useState(organization?.description || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { t } = useLocale()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let imageUrl = organization?.image || ''

    if (selectedFile) {
      const formData = new FormData()
      formData.append('image', selectedFile)
      const uploadRes = await uploadImage(formData)
      if (uploadRes.ok && uploadRes.body?.data?.url) {
        imageUrl = uploadRes.body.data.url
      } else {
        alert(t('failed_to_upload_image'))
        return
      }
    }

    onSubmit({ title, description, image: imageUrl })
  }

  const handleFileSelected = (file: File | null) => {
    setSelectedFile(file)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">
        {organization ? t('edit_organization') : t('create_organization')}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            {t('title')}
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            {t('description')}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={4}
          />
        </div>
        <ImageUpload
          onFileSelected={handleFileSelected}
          currentImage={organization?.image}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {organization ? t('update') : t('create')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default OrganizationForm