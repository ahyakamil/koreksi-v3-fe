import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import { useLocale } from '../context/LocaleContext'

export default function Notifications(){
  const [notes, setNotes] = useState([])
  const { t } = useLocale()

  async function load(){
    const res = await apiFetch('/notifications')
    if (res.body && res.body.statusCode===2000) setNotes(res.body.data.notifications || [])
  }

  useEffect(()=>{ load() }, [])

  return (
    <div className="container py-8">
      <h2 className="text-xl font-semibold mb-4">{/* translated */}{typeof window!=='undefined' && ''}{/* placeholder to avoid hydration issues */}{/* real text: */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{/* */}{t('notifications')}</h2>
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
