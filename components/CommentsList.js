import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import CommentForm from './CommentForm'
import { formatDate } from '../utils/format'

export default function CommentsList({ postId }){
  const [comments, setComments] = useState([])
  const [pageable, setPageable] = useState(null)
  const [loadedSize, setLoadedSize] = useState(3)

  async function load(currentSize = loadedSize){
    const res = await apiFetch(`/posts/${postId}/comments?page=0&size=${currentSize}`)
    if (res.body && res.body.statusCode === 2000) {
      const items = (res.body.data && (res.body.data.comments || res.body.data.content)) || []
      setComments(items)
      setPageable(res.body.data.pageable || null)
    }
  }

  useEffect(()=>{ load() }, [postId, loadedSize])

  const total = pageable ? pageable.totalElements : comments.length

  function handleLoadMore(){
    setLoadedSize(s => s + 10)
  }

  return (
    <div className="mt-3">
      <h4 className="text-sm font-medium">Comments ({total})</h4>
      <div className="mt-2 space-y-2">
        {comments.map(c => (
          <div key={c.id} className="p-2 bg-gray-50 rounded">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">{c.user?.name || 'User'}</div>
              <div className="text-xs text-gray-400">{formatDate(c.created_at)}</div>
            </div>
            <div className="mt-1">{c.content}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div>
          {comments.length < total && (
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={handleLoadMore}>Load more</button>
          )}
        </div>
        <div className="text-xs text-gray-600">Showing {comments.length} of {total}</div>
      </div>
      <CommentForm postId={postId} onCreated={() => { setLoadedSize(s => s + 1) }} />
    </div>
  )
}
