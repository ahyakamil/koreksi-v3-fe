import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import { useLocale } from '../context/LocaleContext'
import { useAuth } from '../context/AuthContext'

export default function Friends(){
  const { t } = useLocale()
  const { refreshPendingCount } = useAuth()
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [blocked, setBlocked] = useState([])
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [msg, setMsg] = useState(null)

  async function load(){
    const f = await apiFetch('/friends')
    if (f.body && f.body.statusCode===2000) setFriends(f.body.data.friends || [])
    const r = await apiFetch('/friends/requests')
    if (r.body && r.body.statusCode===2000) setRequests(r.body.data.requests || [])
    const b = await apiFetch('/friends/blocked')
    if (b.body && b.body.statusCode===2000) setBlocked(b.body.data.blocked || [])
  }

  useEffect(()=>{ load() }, [])

  async function search(){
    setMsg(null)
    const res = await apiFetch(`/users/search?q=${encodeURIComponent(query)}`)
    if (res.body && res.body.statusCode===2000) setSearchResults(res.body.data.users || [])
    else setMsg('Search failed')
  }

  async function send(){
    if (!selectedUser) return
    setMsg(null)
    const res = await apiFetch('/friends/request', { method: 'POST', body: JSON.stringify({ friend_id: selectedUser.id }) })
    if (res.body && res.body.statusCode===2000) { setMsg(t('request_sent')); setSelectedUser(null); setQuery(''); setSearchResults([]); load() }
    else setMsg(res.body?.message || 'Error')
  }

  async function accept(id){
    await apiFetch(`/friends/${id}/accept`, { method: 'POST' })
    load()
    refreshPendingCount()
  }

  async function decline(id){
    await apiFetch(`/friends/${id}/decline`, { method: 'POST' })
    load()
    refreshPendingCount()
  }

  async function removeFriend(id){
    await apiFetch(`/friends/${id}`, { method: 'DELETE' }); load()
  }

  async function unblockUser(id){
    await apiFetch(`/friends/${id}/unblock`, { method: 'POST' }); load()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h2 className="text-xl font-semibold mb-6">{t('friends')}</h2>

      <section className="mb-8">
        <h3 className="font-medium mb-3">{t('find_friend')}</h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 max-w-md">
          <input
            className="flex-1 border rounded p-2 text-sm"
            placeholder={t('search_by_name')}
            value={query}
            onChange={e=>setQuery(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm whitespace-nowrap"
            onClick={search}
          >
            {t('search')}
          </button>
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-3 space-y-1 max-w-md">
            {searchResults.map(u => (
              <li
                key={u.id}
                className="p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => { setSelectedUser(u); setSearchResults([]); setQuery(u.name) }}
              >
                <div className="font-medium">{u.name}</div>
                <div className="text-sm text-gray-600">{u.email}</div>
              </li>
            ))}
          </ul>
        )}
        {selectedUser && (
          <div className="mt-3 p-3 bg-blue-50 rounded flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <span className="text-sm">Send request to: <strong>{selectedUser.name}</strong></span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-green-600 text-white rounded text-sm" onClick={send}>{t('send')}</button>
              <button className="px-3 py-1 bg-gray-300 rounded text-sm" onClick={() => { setSelectedUser(null); setQuery('') }}>Cancel</button>
            </div>
          </div>
        )}
        {msg && <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">{msg}</div>}
      </section>

      <section className="mb-8">
        <h3 className="font-medium mb-3">{t('incoming_requests')}</h3>
        {requests.length===0 && <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded">{t('no_requests')}</div>}
        <ul className="space-y-3">
          {requests.map(r=> (
            <li key={r.id} className="p-4 bg-white rounded-lg shadow border flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {r.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{r.user.name}</div>
                  <div className="text-sm text-gray-600">{t('friend_request')}</div>
                </div>
              </div>
              <div className="flex space-x-2 sm:ml-4">
                <button
                  onClick={()=>accept(r.id)}
                  className="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                >
                  {t('accept')}
                </button>
                <button
                  onClick={()=>decline(r.id)}
                  className="px-3 py-1.5 bg-gray-300 rounded text-sm hover:bg-gray-400 transition-colors"
                >
                  {t('decline')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="font-medium mb-3">{t('friends')}</h3>
        {friends.length===0 && <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded">{t('no_friends')}</div>}
        <ul className="space-y-3">
          {friends.map(f=> (
            <li key={f.friendship_id} className="p-4 bg-white rounded-lg shadow border flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-medium text-sm">
                    {f.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{f.user.name}</div>
                  <div className="text-sm text-gray-600">{f.user.email}</div>
                </div>
              </div>
              <div className="sm:ml-4">
                <button
                  onClick={()=>removeFriend(f.friendship_id)}
                  className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                >
                  {t('remove')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="font-medium mb-3">{t('blocked_users')}</h3>
        {blocked.length===0 && <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded">{t('no_blocked_users')}</div>}
        <ul className="space-y-3">
          {blocked.map(b=> (
            <li key={b.friendship_id} className="p-4 bg-white rounded-lg shadow border flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-medium text-sm">
                    {b.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{b.user.name}</div>
                  <div className="text-sm text-gray-600">{b.user.email}</div>
                </div>
              </div>
              <div className="sm:ml-4">
                <button
                  onClick={()=>unblockUser(b.friendship_id)}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  {t('unblock')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// (component already uses useLocale)
