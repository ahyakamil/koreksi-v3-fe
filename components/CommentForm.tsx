import { useState } from 'react'
import { apiFetch } from '../utils/api'
import { useLocale } from '../context/LocaleContext'

export default function CommentForm({ postId, onCreated, parentId=null }: { postId: string, onCreated?: (comment: any) => void, parentId?: string | null }){
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { t } = useLocale()

  async function submit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    const bodyData: any = { content }
    if (parentId) bodyData.parent_id = parentId
    const res = await apiFetch(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(bodyData) })
    if (res.body && res.body.statusCode === 2000) {
      setContent('')
      if (onCreated) onCreated(res.body.data.comment)
    } else {
      setError(res.body?.message || 'Error')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={submit} className="mt-2">
      <textarea disabled={submitting} rows={2} className="w-full border rounded p-2" placeholder={t('write_comment')} value={content} onChange={e=>setContent(e.target.value)} />
      {error && <div className="text-red-600">{error}</div>}
      <div className="mt-2">
        <button disabled={submitting} className="px-3 py-1 bg-gray-200 rounded">{submitting ? t('loading') : t('send')}</button>
      </div>
    </form>
  )
}
