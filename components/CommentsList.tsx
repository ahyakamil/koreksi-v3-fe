import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import CommentForm from './CommentForm'
import { formatDate } from '../utils/format'
import { useLocale } from '../context/LocaleContext'
import { useAuth } from '../context/AuthContext'

export default function CommentsList({ postId }){
  const [comments, setComments] = useState([])
  const [pageable, setPageable] = useState(null)
  const [loadedSize, setLoadedSize] = useState(3)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load(currentSize = loadedSize){
    if (loading) return
    setLoading(true)
    const res = await apiFetch(`/posts/${postId}/comments?page=0&size=${currentSize}`)
    if (res.body && res.body.statusCode === 2000) {
      const items = (res.body.data && (res.body.data.comments || res.body.data.content)) || []
      setComments(items)
      setPageable(res.body.data.pageable || null)
    }
    setLoading(false)
    setLoadingMore(false)
  }

  useEffect(()=>{ if (loaded) load() }, [postId, loadedSize, loaded])

  const { t } = useLocale()
  const { user } = useAuth()

  const total = pageable ? pageable.totalElements : comments.length

  function handleLoadComments(){
    setLoaded(true)
  }

  function handleLoadMore(){
    setLoadingMore(true)
    setLoadedSize(s => s + 10)
  }

  return (
    <div className="mt-3">
      <h4 className="text-sm font-medium">{t('comments')} {loaded ? `(${total})` : ''}</h4>
      {loaded && (
        <div className="mt-2 space-y-2">
          {comments.map(c => (
            <div key={c.id} className="p-2 bg-gray-50 rounded">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">{c.user?.name || t('user')}</div>
                <div className="text-xs text-gray-400">{formatDate(c.created_at)}</div>
              </div>
              <div className="mt-1">{c.content}</div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <div>
          {loaded && comments.length < total && (
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? t('loading') : t('load_more')}
            </button>
          )}
          {!loaded && (
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={handleLoadComments}>
              {t('load_comments') || 'Load Comments'}
            </button>
          )}
        </div>
        {loaded && <div className="text-xs text-gray-600">{t('showing_range', { count: comments.length, total })}</div>}
      </div>
      {user && loaded && <CommentForm postId={postId} onCreated={() => { setLoadedSize(s => s + 1) }} />}
      {user && !loaded && <CommentForm postId={postId} onCreated={() => { setLoaded(true) }} />}
    </div>
  )
}
