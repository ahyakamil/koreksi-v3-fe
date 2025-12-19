import { useState } from 'react'
import { apiFetch } from '../utils/api'
import { useLocale } from '../context/LocaleContext'

export default function CommentForm({ postId, onCreated, parentId=null }){
  const [content, setContent] = useState('')
  const [error, setError] = useState(null)
  const { t } = useLocale()

  async function submit(e){
    e.preventDefault()
    setError(null)
    const bodyData = { content }
    if (parentId) bodyData.parent_id = parentId
    const res = await apiFetch(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(bodyData) })
    if (res.body && res.body.statusCode === 2000) {
      setContent('')
      if (onCreated) onCreated(res.body.data.comment)
    } else {
      setError(res.body?.message || 'Error')
    }
  }

  return (
    <form onSubmit={submit} className="mt-2">
      <textarea rows={2} className="w-full border rounded p-2" placeholder={t('write_comment')} value={content} onChange={e=>setContent(e.target.value)} />
      {error && <div className="text-red-600">{error}</div>}
      <div className="mt-2">
        <button className="px-3 py-1 bg-gray-200 rounded">{t('send')}</button>
      </div>
    </form>
  )
}
