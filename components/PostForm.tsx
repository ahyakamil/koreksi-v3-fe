import { useState } from 'react'
import { apiFetch } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { Media } from '../types'
import MultiImageUpload from './MultiImageUpload'

export default function PostForm({ onCreated }: { onCreated?: (post: any) => void }){
  const [content,setContent] = useState('')
  const [title,setTitle] = useState('')
  const [imageFiles,setImageFiles] = useState<File[]>([])
  const [error,setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const { t } = useLocale()


  const handleFilesSelected = (files: File[]) => {
    setImageFiles(files)
  }

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
      <MultiImageUpload
        onFilesSelected={handleFilesSelected}
        selectedFiles={imageFiles}
        disabled={submitting}
      />
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <div className="mt-2">
        <button disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">{submitting ? t('loading') : t('post_button')}</button>
      </div>
    </form>
  )
}
