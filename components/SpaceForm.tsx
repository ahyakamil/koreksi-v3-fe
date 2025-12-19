import React, { useState } from 'react'
import { Space } from '../types'
import ImageUpload from './ImageUpload'
import { uploadImage } from '../utils/api'

interface SpaceFormProps {
  space?: Space
  onSubmit: (data: { name: string; description?: string; image?: string }) => void
  onCancel: () => void
}

const SpaceForm: React.FC<SpaceFormProps> = ({ space, onSubmit, onCancel }) => {
  const [name, setName] = useState(space?.name || '')
  const [description, setDescription] = useState(space?.description || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelected = (file: File | null) => {
    setSelectedFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    let finalImage = space?.image || undefined

    // Upload image if a new file was selected
    if (selectedFile) {
      const formData = new FormData()
      formData.append('image', selectedFile)
      const uploadRes = await uploadImage(formData)
      if (uploadRes.ok && uploadRes.body?.data?.url) {
        finalImage = uploadRes.body.data.url
      } else {
        alert('Failed to upload image')
        setUploading(false)
        return
      }
    }

    onSubmit({
      name,
      description: description || undefined,
      image: finalImage
    })
    setUploading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Space Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image (Optional)
        </label>
        <ImageUpload
          onFileSelected={handleFileSelected}
          currentImage={space?.image}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={uploading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : (space ? 'Update Space' : 'Create Space')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={uploading}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default SpaceForm