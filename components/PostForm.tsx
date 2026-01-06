import { useState } from 'react'
import { apiFetch, uploadImage } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { Media } from '../types'
import MultiImageUpload from './MultiImageUpload'

export default function PostForm({ onCreated }: { onCreated?: (post: any) => void }){
  const [content,setContent] = useState('')
  const [title,setTitle] = useState('')
  const [youtubeVideo,setYoutubeVideo] = useState('')
  const [imageFiles,setImageFiles] = useState<File[]>([])
  const [error,setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const { t } = useLocale()


  const handleFilesSelected = (files: File[]) => {
    setImageFiles(files)
  }


  async function submit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)

    const medias: Omit<Media, 'id'>[] = []
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      const formData = new FormData()
      formData.append('image', file)
      const uploadRes = await uploadImage(formData)
      if (!uploadRes.ok || !uploadRes.body?.data?.url) {
        setError(`Failed to upload ${file.name}`)
        setSubmitting(false)
        return
      }
      medias.push({
        url: uploadRes.body.data.url,
        type: i === 0 ? 'main' : 'additional',
        order: i
      })
    }

    const { body } = await apiFetch('/posts', { method: 'POST', body: JSON.stringify({ title, content, youtube_video: youtubeVideo, medias }) })
    if (body && body.statusCode === 2000) {
      setTitle('')
      setContent('')
      setYoutubeVideo('')
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
      <div className="text-sm text-gray-600">{t('posting_as')} {user.name}</div>
      <input disabled={submitting} className="w-full border rounded p-2 mt-2" placeholder={t('title')} value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea disabled={submitting} rows={4} className="w-full border rounded p-2 mt-2" value={content} onChange={e=>setContent(e.target.value)} placeholder={t('content_placeholder')} />
      <input disabled={submitting} className="w-full border rounded p-2 mt-2" placeholder="YouTube Video ID" value={youtubeVideo} onChange={e=>setYoutubeVideo(e.target.value)} />
      {youtubeVideo && (
        <div className="mt-2">
          <iframe
            width="560"
            height="315"
            src={`https://www.youtube.com/embed/${youtubeVideo}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}
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
