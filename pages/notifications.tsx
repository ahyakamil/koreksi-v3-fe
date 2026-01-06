import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { Notification } from '../types'
import Router from 'next/router'

export default function Notifications(){
  const { t } = useLocale()
  const { user, refreshNotificationsCount } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  async function load(){
    setLoading(true)
    setNotifications([])
    setPage(0)
    setHasMore(false)
    const res = await apiFetch('/notifications?page=0&size=10')
    if (res.body && res.body.statusCode === 2000) {
      const content = res.body.data.content || []
      const pageable = res.body.data.pageable
      setNotifications(content)
      setHasMore(pageable.pageNumber + 1 < pageable.totalPages)
    }
    setLoading(false)
  }

  async function loadMore(){
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    const res = await apiFetch(`/notifications?page=${nextPage}&size=10`)
    if (res.body && res.body.statusCode === 2000) {
      const content = res.body.data.content || []
      const pageable = res.body.data.pageable
      setNotifications(prev => [...prev, ...content])
      setPage(nextPage)
      setHasMore(pageable.pageNumber + 1 < pageable.totalPages)
    }
    setLoadingMore(false)
  }

  useEffect(()=>{ if (user) load() }, [user])

  async function markAsRead(id: string){
    await apiFetch('/notifications/mark-read', { method: 'POST', body: JSON.stringify({ ids: [id] }) })
    load()
    refreshNotificationsCount()
  }

  function handleClick(notification: Notification){
    markAsRead(notification.id)
    if (notification.data.type === 'comment' || notification.data.type === 'reply') {
      const { commentable_type, commentable_id, comment_id } = notification.data
      if (commentable_type === 'post') {
        Router.push(`/posts/${commentable_id}?commentId=${comment_id}`)
      } else if (commentable_type === 'news') {
        Router.push(`/news/${commentable_id}?commentId=${comment_id}`)
      }
    } else if (notification.data.type === 'friend_request') {
      Router.push('/friends?tab=requests')
    }
  }

  if (!user) return <div>Please login</div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h2 className="text-xl font-semibold mb-6">{t('notifications')}</h2>

      {loading && <div>Loading...</div>}

      {!loading && notifications.length === 0 && <div className="text-gray-600">{t('no_notifications')}</div>}

      <ul className="space-y-3">
        {notifications.map(n => (
          <li
            key={n.id}
            className={`p-4 bg-white rounded-lg shadow border cursor-pointer hover:bg-gray-50 transition-colors ${!n.read_at ? 'border-l-4 border-l-blue-500' : ''}`}
            onClick={() => handleClick(n)}
          >
            <div className="font-medium">{n.data.message}</div>
            <div className="text-sm text-gray-600">{new Date(n.created_at).toLocaleString()}</div>
            {!n.read_at && <div className="text-xs text-blue-600 mt-1">Unread</div>}
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}
