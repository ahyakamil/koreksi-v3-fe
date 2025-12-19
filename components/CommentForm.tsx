import { useState } from 'react'
import { createComment } from '../utils/api'
import { useLocale } from '../context/LocaleContext'

interface CommentFormProps {
  commentableType: string
  commentableId: string
  onSubmit: (content: string, parentId?: string) => Promise<any>
  parentId?: string | null
}

export default function CommentForm({ commentableType, commentableId, onSubmit, parentId = null }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { t } = useLocale()

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting || !content.trim()) return
    setError(null)
    setSubmitting(true)

    try {
      await onSubmit(content, parentId || undefined)
      setContent('')
    } catch (err) {
      setError('Failed to post comment')
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
