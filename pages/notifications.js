import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import { useLocale } from '../context/LocaleContext'
import { useAuth } from '../context/AuthContext'

export default function Notifications(){
  const [notes, setNotes] = useState([])
  const { t } = useLocale()
  const { refreshNotificationsCount } = useAuth()

  async function load(){
    const res = await apiFetch('/notifications')
    if (res.body && res.body.statusCode===2000) setNotes(res.body.data.notifications || [])
    // Mark as read
    await apiFetch('/notifications/mark-read', { method: 'POST' })
    // Refresh count
    refreshNotificationsCount()
  }

  useEffect(()=>{ load() }, [])

  return (
    <div className="container py-8">
        <h2 className="text-xl font-semibold mb-4">{t('notifications')}</h2>
      {notes.length===0 && <div className="text-sm text-gray-600">{t('no_notifications')}</div>}
      <ul className="space-y-3">
        {notes.map(n=> (
          <li key={n.id} className="p-3 bg-white rounded shadow">
            <div className="text-sm text-gray-600">{new Date(n.created_at).toLocaleString()}</div>
            <div className="mt-1">{n.data?.message || JSON.stringify(n.data)}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
