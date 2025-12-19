import { useState } from 'react'
import { apiFetch } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

export default function PostForm({ onCreated }: { onCreated?: (post: any) => void }){
  const [content,setContent] = useState('')
  const [title,setTitle] = useState('')
  const [imageFile,setImageFile] = useState<File | null>(null)
  const [imageUrl,setImageUrl] = useState('')
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

  async function submit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)

    let finalImageUrl = imageUrl
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile)
      if (!uploadedUrl) {
        setError('Failed to upload image')
        setSubmitting(false)
        return
      }
      finalImageUrl = uploadedUrl
    }

    const { body } = await apiFetch('/posts', { method: 'POST', body: JSON.stringify({ title, content, image: finalImageUrl }) })
    if (body && body.statusCode === 2000) {
      setTitle('')
      setContent('')
      setImageFile(null)
      setImageUrl('')
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
      <input disabled={submitting} type="file" accept="image/png,image/jpeg" className="w-full border rounded p-2 mt-2" onChange={e=>setImageFile(e.target.files?.[0] || null)} />
      {imageFile && <div className="mt-1 text-sm text-gray-600">Selected: {imageFile.name}</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <div className="mt-2">
        <button disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">{submitting ? t('loading') : t('post_button')}</button>
      </div>
    </form>
  )
}
