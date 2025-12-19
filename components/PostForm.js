import { useState } from 'react'
import { apiFetch } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

export default function PostForm({ onCreated }){
  const [content,setContent] = useState('')
  const [title,setTitle] = useState('')
  const [image,setImage] = useState('')
  const [error,setError] = useState(null)
  const { user } = useAuth()
  const { t } = useLocale()

  async function submit(e){
    e.preventDefault()
    setError(null)
    const { body } = await apiFetch('/posts', { method: 'POST', body: JSON.stringify({ title, content, image }) })
    if (body && body.statusCode === 2000) {
      setTitle('')
      setContent('')
      setImage('')
      if (onCreated) onCreated(body.data.post)
    } else {
      setError(body?.message || body?.errCode || 'Error')
    }
  }

  if (!user) return null

  return (
    <form onSubmit={submit} className="mb-6 bg-white p-4 rounded shadow">
      <div className="text-sm text-gray-600">{t('posting_as')} {user.name || user.email}</div>
      <input className="w-full border rounded p-2 mt-2" placeholder={t('title')} value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea rows={4} className="w-full border rounded p-2 mt-2" value={content} onChange={e=>setContent(e.target.value)} placeholder={t('content_placeholder')} />
      <input className="w-full border rounded p-2 mt-2" placeholder={t('image_placeholder')} value={image} onChange={e=>setImage(e.target.value)} />
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <div className="mt-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded">{t('post_button')}</button>
      </div>
    </form>
  )
}
