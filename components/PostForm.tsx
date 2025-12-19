import { useState } from 'react'
import { apiFetch } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { Media } from '../types'

export default function PostForm({ onCreated }: { onCreated?: (post: any) => void }){
  const [content,setContent] = useState('')
  const [title,setTitle] = useState('')
  const [imageFiles,setImageFiles] = useState<File[]>([])
  const [error,setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const { t } = useLocale()

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData()
    formData.append('image', file)
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1') + '/upload/image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: formData
    })
    const json = await res.json()
    if (json.statusCode === 2000) {
      return json.data.url
    }
    return null
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).filter(file => {
      if (file.size > 2 * 1024 * 1024) { // 2MB
        alert(t('file_too_large', { name: file.name }))
        return false
      }
      return true
    })
    setImageFiles(prev => [...prev, ...files])
    // Reset input value to allow selecting same files again
    e.target.value = ''
  }

  function removeImage(index: number) {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function submit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)

    const medias: Omit<Media, 'id'>[] = []
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      const url = await uploadImage(file)
      if (!url) {
        setError(`Failed to upload ${file.name}`)
        setSubmitting(false)
        return
      }
      medias.push({
        url,
        type: i === 0 ? 'main' : 'additional',
        order: i
      })
    }

    const { body } = await apiFetch('/posts', { method: 'POST', body: JSON.stringify({ title, content, medias }) })
    if (body && body.statusCode === 2000) {
      setTitle('')
      setContent('')
      setImageFiles([])
      if (onCreated) onCreated(body.data.post)
    } else {
      setError(body?.message || body?.errCode || 'Error')
    }
    setSubmitting(false)
  }

  if (!user) return null

  return (
    <form onSubmit={submit} className="mb-6 bg-white p-4 rounded shadow">
      <div className="text-sm text-gray-600">{t('posting_as')} {user.name || user.email}</div>
      <input disabled={submitting} className="w-full border rounded p-2 mt-2" placeholder={t('title')} value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea disabled={submitting} rows={4} className="w-full border rounded p-2 mt-2" value={content} onChange={e=>setContent(e.target.value)} placeholder={t('content_placeholder')} />
      <div className="mt-2">
        <label className="block text-sm font-medium mb-2">Upload Images</label>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => document.getElementById('image-upload')?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const files = Array.from(e.dataTransfer.files).filter(f => {
              if (f.type !== 'image/png' && f.type !== 'image/jpeg') return false
              if (f.size > 2 * 1024 * 1024) {
                alert(t('file_too_large', { name: f.name }))
                return false
              }
              return true
            })
            setImageFiles(prev => [...prev, ...files])
          }}
        >
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium">Drop images here or click to browse</p>
            <p className="text-sm">PNG or JPG files only</p>
          </div>
        </div>
        <input
          id="image-upload"
          type="file"
          accept="image/png,image/jpeg"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={submitting}
        />
      </div>
      {imageFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Selected Images ({imageFiles.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imageFiles.map((file, index) => (
              <div key={index} className="relative group border rounded-lg overflow-hidden shadow-sm">
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-24 object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-2 bg-gray-50">
                  <p className="text-xs text-gray-600 truncate">{file.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <div className="mt-2">
        <button disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">{submitting ? t('loading') : t('post_button')}</button>
      </div>
    </form>
  )
}
