import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { Organization, User, Space, News, OrganizationUser } from '../../types'
import { getOrganization, getPublicOrganization, getOrganizationMembers, checkOrganizationMembership, updateUserRole, removeMember, inviteUser, searchUsers, getSpaces, getNews, createSpace, updateSpace, deleteSpace, reviewNews, joinOrganization } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import SpaceForm from '../../components/SpaceForm'
import NewsItem from '../../components/NewsItem'

const OrganizationDetailsPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState<boolean | null>(null)
  const [memberRole, setMemberRole] = useState<string | null>(null)
  const [inviteSearch, setInviteSearch] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showInvite, setShowInvite] = useState(false)
  const [activeTab, setActiveTab] = useState('news')
  const [spaces, setSpaces] = useState<Space[]>([])
  const [news, setNews] = useState<News[]>([])
  const [members, setMembers] = useState<OrganizationUser[]>([])
  const [membersPage, setMembersPage] = useState(0)
  const [hasMoreMembers, setHasMoreMembers] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [showCreateSpace, setShowCreateSpace] = useState(false)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [joining, setJoining] = useState(false)
  const { user } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id && user) {
      fetchOrganization()
    }
  }, [id, user])

  const fetchOrganization = async () => {
    if (!id) return
    let res = await getOrganization(id as string)
    if (!res.ok) {
      // Try public access
      res = await getPublicOrganization(id as string)
    }
    if (res.ok) {
      setOrganization(res.body.data.organization)
      // Check membership if authenticated
      if (user) {
        const membershipRes = await checkOrganizationMembership(id as string)
        if (membershipRes.ok) {
          setIsMember(membershipRes.body.data.is_member)
          setMemberRole(membershipRes.body.data.role)
        }
      }
    } else {
      alert(res.body.message || t('failed_to_load_organization'))
      router.push('/organizations')
    }
    setLoading(false)
  }

  const fetchSpaces = async () => {
    if (!id) return
    const res = await getSpaces(id as string)
    if (res.ok) {
      setSpaces(res.body.data.spaces)
    }
  }

  const fetchNews = async () => {
    if (!id) return
    // Load all published news pages
    const allNews: any[] = []
    let page = 0
    const size = 50

    while (true) {
      const res = await getNews(id as string, page, size)
      if (res.ok && res.body.data.content) {
        allNews.push(...res.body.data.content)
        const pageable = res.body.data.pageable
        if (pageable.pageNumber + 1 >= pageable.totalPages) break
        page++
      } else {
        break
      }
    }

    setNews(allNews)
  }

  const fetchMembers = async () => {
    if (!id) return
    setLoadingMembers(true)
    setMembers([])
    setMembersPage(0)
    setHasMoreMembers(false)
    const res = await getOrganizationMembers(id as string, 0, 10)
    if (res.ok && res.body.data.content) {
      setMembers(res.body.data.content)
      const pageable = res.body.data.pageable
      setHasMoreMembers(pageable.pageNumber + 1 < pageable.totalPages)
    }
    setLoadingMembers(false)
  }

  const loadMoreMembers = async () => {
    if (!hasMoreMembers || loadingMembers) return
    setLoadingMembers(true)
    const nextPage = membersPage + 1
    const res = await getOrganizationMembers(id as string, nextPage, 10)
    if (res.ok && res.body.data.content) {
      setMembers(prev => [...prev, ...res.body.data.content])
      setMembersPage(nextPage)
      const pageable = res.body.data.pageable
      setHasMoreMembers(pageable.pageNumber + 1 < pageable.totalPages)
    }
    setLoadingMembers(false)
  }


  const handleCreateSpace = async (data: { name: string; description?: string; image?: string }) => {
    if (!organization) return
    const res = await createSpace(organization.id, data)
    if (res.ok) {
      setSpaces([...spaces, res.body.data.space])
      setShowCreateSpace(false)
    } else {
      alert(res.body.message || t('failed_to_create_space'))
    }
  }

  const handleUpdateSpace = async (data: { name?: string; description?: string; image?: string }) => {
    if (!organization || !editingSpace) return
    const res = await updateSpace(organization.id, editingSpace.id, data)
    if (res.ok) {
      setSpaces(spaces.map(s => s.id === editingSpace.id ? res.body.data.space : s))
      setEditingSpace(null)
    } else {
      alert(res.body.message || 'Failed to update space')
    }
  }

  const handleDeleteSpace = async (spaceId: string) => {
    if (!organization) return
    if (!confirm(t('are_you_sure_delete_space'))) return
    const res = await deleteSpace(organization.id, spaceId)
    if (res.ok) {
      setSpaces(spaces.filter(s => s.id !== spaceId))
    } else {
      alert(res.body.message || t('failed_to_delete_space'))
    }
  }

  const handleReviewNews = async (newsPublicId: string, action: 'publish' | 'reject') => {
    if (!organization) return
    let reviewNotes: string | undefined = undefined
    if (action === 'reject') {
      const notes = prompt(t('enter_rejection_reason'))
      if (!notes) return
      reviewNotes = notes
    }

    const res = await reviewNews(organization.id, newsPublicId, { action, review_notes: reviewNotes })
    if (res.ok) {
      fetchNews() // Refresh the news list
    } else {
      alert(res.body.message || t('failed_to_review_news'))
    }
  }

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    if (!organization) return
    const res = await updateUserRole(organization.id, targetUserId, newRole)
    if (res.ok) {
      setOrganization(res.body.data.organization)
    } else {
      alert(res.body.message || t('failed_to_update_role'))
    }
  }

  const handleRemoveMember = async (targetUserId: string) => {
    if (!organization) return
    if (!confirm(t('are_you_sure_remove_member'))) return
    const res = await removeMember(organization.id, targetUserId)
    if (res.ok) {
      setOrganization(res.body.data.organization)
    } else {
      alert(res.body.message || t('failed_to_remove_member'))
    }
  }

  const handleSearchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    const res = await searchUsers(query)
    if (res.ok) {
      setSearchResults(res.body.data.users.filter((u: User) => !organization?.users?.some(ou => ou.id === u.id)))
    }
  }

  const handleInvite = async (userId: string) => {
    if (!organization) return
    const res = await inviteUser(organization.id, userId)
    if (res.ok) {
      setOrganization(res.body.data.organization)
      setInviteSearch('')
      setSearchResults([])
      setShowInvite(false)
    } else {
      alert(res.body.message || t('failed_to_invite_user'))
    }
  }

  const handleJoin = async () => {
    if (!organization || joining) return
    setJoining(true)
    const res = await joinOrganization(organization.id)
    if (res.ok) {
      setIsMember(true)
      setMemberRole('user') // Default role for new members
    } else {
      alert(res.body.message || t('failed_to_join_organization'))
    }
    setJoining(false)
  }

  const currentUserRole = useMemo(() => {
    return memberRole
  }, [memberRole])

  const canManage = currentUserRole && ['admin', 'editor', 'author'].includes(currentUserRole)

  useEffect(() => {
    if (organization && activeTab === 'spaces' && currentUserRole) {
      fetchSpaces()
    } else if (organization && activeTab === 'news' && currentUserRole) {
      fetchNews()
    } else if (organization && activeTab === 'members' && currentUserRole) {
      fetchMembers()
    }
  }, [organization, activeTab, currentUserRole])

  if (loading) return <div>{t('loading')}</div>
  if (!organization) return <div>{t('organization_not_found')}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.push('/organizations')}
          className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          {t('back_to_organizations')}
        </button>
        <h1 className="text-3xl font-bold">{organization.title}</h1>
        {organization.description && (
          <p className="text-gray-600 mt-2">{organization.description}</p>
        )}
        {organization.image && (
          <img src={organization.image} alt={organization.title} className="w-full h-48 object-cover rounded-lg mt-4" />
        )}
      </div>

      {canManage && (
        <div className="mb-8">
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('news')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'news'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('news')}
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'members'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('members')} ({organization.users_count || 0})
              </button>
              <button
                onClick={() => setActiveTab('spaces')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'spaces'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('spaces')} ({organization.spaces_count || 0})
              </button>
              <button
                onClick={() => router.push(`/organizations/${id}/news`)}
                className="py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                {t('manage_news')}
              </button>
            </nav>
          </div>

          {activeTab === 'members' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">{t('members')}</h2>
                {currentUserRole === 'admin' && (
                  <button
                    onClick={() => setShowInvite(!showInvite)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    {t('invite_user')}
                  </button>
                )}
              </div>

              {showInvite && (
                <div className="mb-4 p-4 bg-gray-100 rounded">
                  <input
                    type="text"
                    placeholder={t('search_users_by_name_or_email')}
                    value={inviteSearch}
                    onChange={(e) => {
                      setInviteSearch(e.target.value)
                      handleSearchUsers(e.target.value)
                    }}
                    className="w-full p-2 border rounded mb-2"
                  />
                  {searchResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto">
                      {searchResults.map((u) => (
                        <div key={u.id} className="flex justify-between items-center p-2 bg-white rounded mb-1">
                          <span>{u.name} ({u.email})</span>
                          <button
                            onClick={() => handleInvite(u.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            {t('invite')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                {members.map((member) => (
                  <div key={member.id} className="flex justify-between items-center bg-white p-4 rounded-lg shadow mb-2">
                    <div>
                      <span className="font-semibold">{member.name}</span> ({member.email})
                      <span className="ml-2 bg-gray-200 px-2 py-1 rounded text-sm">
                        {member.pivot?.role}
                      </span>
                    </div>
                    {currentUserRole === 'admin' && member.id !== user?.id && (
                      <div className="flex gap-2">
                        <select
                          value={member.pivot?.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="p-1 border rounded"
                        >
                          <option value="user">{t('user_role_user')}</option>
                          <option value="author">{t('user_role_author')}</option>
                          <option value="editor">{t('user_role_editor')}</option>
                          <option value="admin">{t('user_role_admin')}</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          {t('remove')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {hasMoreMembers && (
                  <div className="text-center mt-4">
                    <button
                      onClick={loadMoreMembers}
                      disabled={loadingMembers}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      {loadingMembers ? t('loading') : t('load_more')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'spaces' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">{t('spaces')}</h2>

              {showCreateSpace && currentUserRole === 'admin' && (
                <div className="mb-8 p-4 bg-gray-50 rounded">
                  <SpaceForm
                    onSubmit={handleCreateSpace}
                    onCancel={() => setShowCreateSpace(false)}
                  />
                </div>
              )}

              {editingSpace && currentUserRole === 'admin' && (
                <div className="mb-8 p-4 bg-gray-50 rounded">
                  <SpaceForm
                    space={editingSpace}
                    onSubmit={handleUpdateSpace}
                    onCancel={() => setEditingSpace(null)}
                  />
                </div>
              )}

              <div>
                {spaces.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">{t('no_spaces_found_create_first')}</p>
                    {currentUserRole === 'admin' && (
                      <button
                        onClick={() => setShowCreateSpace(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 text-lg"
                      >
                        {t('create_space')}
                      </button>
                    )}
                  </div>
                ) : (
                  spaces.map(space => (
                    <div key={space.id} className="bg-white p-4 rounded-lg shadow mb-2">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {space.image ? (
                            <img src={space.image} alt={space.name} className="w-16 h-16 object-cover rounded-lg" />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-500 text-xs">{t('no_image')}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{space.name}</h3>
                          {space.description && (
                            <p className="text-gray-600 mt-1">{space.description}</p>
                          )}
                        </div>
                        {currentUserRole === 'admin' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingSpace(space)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                            >
                              {t('edit')}
                            </button>
                            <button
                              onClick={() => handleDeleteSpace(space.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                            >
                              {t('delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">{t('news')}</h2>
              {news.length === 0 ? (
                <p>{t('no_news_available')}</p>
              ) : (
                <ul className="space-y-4">
                  {news.map(item => (
                    <NewsItem key={item.public_id} news={item} hideOrganization={true} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {currentUserRole && !canManage && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t('published_news')}</h2>
          {news.length === 0 ? (
            <p>{t('no_news_available')}</p>
          ) : (
            <ul className="space-y-4">
              {news.map(item => (
                <NewsItem key={item.public_id} news={item} hideOrganization={true} />
              ))}
            </ul>
          )}
        </div>
      )}

      {isMember === false && (
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">{t('join_to_see_published_news')}</h3>
            <p className="text-blue-700 mb-4">
              {t('become_member_to_access_news')}
            </p>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {joining ? t('joining') : t('join_organization')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrganizationDetailsPage