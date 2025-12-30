import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import { useLocale } from '../context/LocaleContext'
import { useAuth } from '../context/AuthContext'
import { User, Friendship, FriendRequest } from '../types'
import { Avatar } from '../components/Avatar'
import { Search, UserPlus, Users, UserCheck, UserX, Shield, Bell } from 'lucide-react'

export default function Friends() {
  const { t } = useLocale()
  const { refreshPendingCount, user } = useAuth()
  const [friends, setFriends] = useState<Friendship[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [blocked, setBlocked] = useState<Friendship[]>([])
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchPage, setSearchPage] = useState(0)
  const [hasMoreSearch, setHasMoreSearch] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('friends')

  async function load() {
    // Load all friends
    const allFriends: any[] = []
    let page = 0
    const size = 100

    while (true) {
      const f = await apiFetch(`/friends?page=${page}&size=${size}`)
      if (f.body && f.body.statusCode === 2000 && f.body.data.content) {
        allFriends.push(...f.body.data.content)
        const pageable = f.body.data.pageable
        if (pageable.pageNumber + 1 >= pageable.totalPages) break
        page++
      } else {
        break
      }
    }

    setFriends(allFriends)

    const r = await apiFetch('/friends/requests')
    if (r.body && r.body.statusCode === 2000) setRequests(r.body.data.requests || [])
    const b = await apiFetch('/friends/blocked')
    if (b.body && b.body.statusCode === 2000) setBlocked(b.body.data.blocked || [])
  }

  useEffect(() => { load() }, [])

  async function search() {
    if (!query.trim()) {
      setMsg(t('search_term_required'))
      return
    }
    if (query.trim().length < 2) {
      setMsg(t('search_term_too_short'))
      return
    }
    setMsg(null)
    setSearchResults([])
    setSearchPage(0)
    setHasMoreSearch(false)
    setSearchLoading(true)
    const res = await apiFetch(`/users/search?q=${encodeURIComponent(query)}&page=0&size=10`)
    setSearchLoading(false)
    if (res.body && res.body.statusCode === 2000) {
      const content = res.body.data.content || []
      const pageable = res.body.data.pageable
      setSearchResults(content)
      setHasMoreSearch(pageable.pageNumber + 1 < pageable.totalPages)
    } else setMsg('Search failed')
  }

  async function loadMoreSearch() {
    if (!hasMoreSearch || searchLoading) return
    setSearchLoading(true)
    const nextPage = searchPage + 1
    const res = await apiFetch(`/users/search?q=${encodeURIComponent(query)}&page=${nextPage}&size=10`)
    setSearchLoading(false)
    if (res.body && res.body.statusCode === 2000) {
      const content = res.body.data.content || []
      const pageable = res.body.data.pageable
      setSearchResults(prev => [...prev, ...content])
      setSearchPage(nextPage)
      setHasMoreSearch(pageable.pageNumber + 1 < pageable.totalPages)
    } else setMsg('Load more failed')
  }

  async function send() {
    if (!selectedUser) return
    setMsg(null)
    const res = await apiFetch('/friends/request', { method: 'POST', body: JSON.stringify({ friend_id: selectedUser.id }) })
    if (res.body && res.body.statusCode === 2000) { setMsg(t('request_sent')); setSelectedUser(null); setQuery(''); setSearchResults([]); setSearchPage(0); setHasMoreSearch(false); load() }
    else setMsg(res.body?.message || 'Error')
  }

  async function accept(id: string) {
    await apiFetch(`/friends/${id}/accept`, { method: 'POST' })
    load()
    refreshPendingCount()
  }

  async function decline(id: string) {
    await apiFetch(`/friends/${id}/decline`, { method: 'POST' })
    load()
    refreshPendingCount()
  }

  async function removeFriend(id: string) {
    await apiFetch(`/friends/${id}`, { method: 'DELETE' }); load()
  }

  async function unblockUser(id: string) {
    await apiFetch(`/friends/${id}/unblock`, { method: 'POST' }); load()
  }

  const tabs = [
    { id: 'friends', label: 'Friends', icon: Users, count: friends.length },
    { id: 'requests', label: 'Requests', icon: Bell, count: requests.length },
    { id: 'search', label: 'Find Friend', icon: Search },
    { id: 'blocked', label: 'Blocked', icon: Shield, count: blocked.length }
  ]

  return (
    <div className="bg-gray-50 pb-20 md:pb-8">
      <div className="mx-auto py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('friends')}</h1>
          <p className="text-gray-600">Manage your friendships and connect with others</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 flex-1 min-w-0 text-center border-b-2 transition-colors ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{t(tab.label)}</span>
                  {tab.count !== undefined && (
                    <span className={`text-xs px-2 py-1 rounded-full ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Search className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('find_friend')}</h3>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={t('search_by_name')}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                </div>

                <button
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  onClick={search}
                >
                  <Search className="w-4 h-4" />
                  {t('search')}
                </button>

                <p className="text-xs text-gray-500">{t('search_hint')}</p>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Search Results</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map(u => (
                      <div
                        key={u.id}
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                        onClick={() => { setSelectedUser(u); setSearchResults([]); setQuery(u.name); setSearchPage(0); setHasMoreSearch(false) }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size={32} />
                          <div>
                            <div className="font-medium text-gray-900">{u.name}</div>
                            <div className="text-sm text-gray-600">{u.email}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasMoreSearch && (
                    <button
                      className="w-full mt-3 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                      onClick={loadMoreSearch}
                      disabled={searchLoading}
                    >
                      {searchLoading ? 'Loading...' : 'Load More'}
                    </button>
                  )}
                </div>
              )}

              {selectedUser && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={selectedUser.name} size={32} />
                    <span className="text-sm font-medium">Send request to: <strong>{selectedUser.name}</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                      onClick={send}
                    >
                      <UserPlus className="w-4 h-4" />
                      {t('send')}
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                      onClick={() => { setSelectedUser(null); setQuery(''); setSearchResults([]); setSearchPage(0); setHasMoreSearch(false) }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {msg && (
                <div className="mt-4 p-3 text-sm text-gray-600 bg-gray-50 rounded-lg border">
                  {msg}
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('incoming_requests')}</h3>
              </div>

              {requests.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">{t('no_requests')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map(r => (
                    <div key={r.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.user.name} size={40} />
                          <div>
                            <div className="font-medium text-gray-900">{r.user.name}</div>
                            <div className="text-sm text-gray-600">{t('friend_request')}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => accept(r.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                          >
                            <UserCheck className="w-4 h-4" />
                            {t('accept')}
                          </button>
                          <button
                            onClick={() => decline(r.id)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                          >
                            {t('decline')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('friends')}</h3>
                <span className="ml-auto text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {friends.length}
                </span>
              </div>

              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">{t('no_friends')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friends.map(f => (
                    <div key={f.friendship_id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar name={f.user.name} size={40} />
                          <div>
                            <div className="font-medium text-gray-900">{f.user.name}</div>
                            <div className="text-sm text-gray-600">{f.user.email}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFriend(f.friendship_id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2"
                        >
                          <UserX className="w-4 h-4" />
                          {t('remove')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Blocked Tab */}
          {activeTab === 'blocked' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('blocked_users')}</h3>
                <span className="ml-auto text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {blocked.length}
                </span>
              </div>

              {blocked.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">{t('no_blocked_users')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blocked.map(b => (
                    <div key={b.friendship_id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar name={b.user.name} size={40} />
                          <div>
                            <div className="font-medium text-gray-900">{b.user.name}</div>
                            <div className="text-sm text-gray-600">{b.user.email}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => unblockUser(b.friendship_id)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          {t('unblock')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// (component already uses useLocale)
