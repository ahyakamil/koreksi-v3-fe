import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Newspaper, Users, Folder, Settings, Heart, Pencil } from 'lucide-react'
import { Organization, User, Space, News, OrganizationUser, DonationCampaign } from '../../types'
import { getOrganization, getPublicOrganization, getOrganizationMembers, checkOrganizationMembership, updateUserRole, removeMember, inviteUser, searchUsers, getSpaces, getNews, createSpace, updateSpace, deleteSpace, reviewNews, joinOrganization, getStickyDonationCampaign, donateToCampaign } from '../../utils/api'
import { formatCurrency, formatNumber } from '../../utils/format'
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
  const [stickyCampaign, setStickyCampaign] = useState<DonationCampaign | null>(null)
  const [donating, setDonating] = useState(false)
  const { user } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id) {
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
    // Load all spaces pages
    const allSpaces: any[] = []
    let page = 0
    const size = 10

    while (true) {
      const res = await getSpaces(id as string, page, size)
      if (res.ok && res.body.data.content) {
        allSpaces.push(...res.body.data.content)
        const pageable = res.body.data.pageable
        if (pageable.pageNumber + 1 >= pageable.totalPages) break
        page++
      } else {
        break
      }
    }

    setSpaces(allSpaces)
  }

  const fetchNews = async () => {
    if (!id) return
    // Load all published news pages
    const allNews: any[] = []
    let page = 0
    const size = 10

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

    // Add organization to each news item
    const newsWithOrg = allNews.map(item => ({ ...item, organization }))
    setNews(newsWithOrg)
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

  const fetchStickyCampaign = async () => {
    if (!id) return
    const res = await getStickyDonationCampaign(id as string)
    if (res.ok) {
      setStickyCampaign(res.body.data.campaign)
    }
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
      setSearchResults(res.body.data.content.filter((u: User) => !organization?.users?.some(ou => ou.id === u.id)))
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

  const handleDonate = async (campaign: DonationCampaign) => {
    if (!organization) return

    // Go to donation detail page
    router.push(`/organizations/${organization.id}/donations/${campaign.id}`)
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
    } else if (organization && currentUserRole && !canManage) {
      // Fetch news and spaces for members who can't manage
      fetchNews()
      fetchSpaces()
    }
    // Always fetch sticky campaign if organization is loaded
    if (organization) {
      fetchStickyCampaign()
    }
  }, [organization, activeTab, currentUserRole, canManage])

  if (loading) return <div>{t('loading')}</div>
  if (!organization) return <div>{t('organization_not_found')}</div>

  return (
    <div className="mx-auto">
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
          <img src={organization.image} alt={organization.title} className="w-full h-32 sm:h-40 md:h-48 object-contain rounded-lg mt-4" />
        )}
      </div>

      {stickyCampaign && currentUserRole && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="w-6 h-6 text-pink-500" />
              <h3 className="text-lg font-semibold text-pink-800">{t('featured_campaign')}</h3>
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">{stickyCampaign.title}</h4>
            {stickyCampaign.description && (
              <p className="text-gray-700 mb-4">{stickyCampaign.description}</p>
            )}

            {/* Progress Bar */}
            {stickyCampaign.target_amount && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{t('progress')}</span>
                  <span>{formatCurrency(stickyCampaign.current_amount || 0)} / {formatCurrency(stickyCampaign.target_amount || 0)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(((stickyCampaign.current_amount || 0) / (stickyCampaign.target_amount || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-right text-sm text-gray-500 mt-1">
                  {Math.round(((stickyCampaign.current_amount || 0) / (stickyCampaign.target_amount || 1)) * 100)}% {t('completed')}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">{t('total_raised')}</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stickyCampaign.current_amount || 0)}
                </div>
                {stickyCampaign.target_amount && (
                  <div className="text-sm text-gray-500">
                    {t('target')}: {formatCurrency(stickyCampaign.target_amount || 0)}
                  </div>
                )}
              </div>
              {user && (
                <button
                  onClick={() => handleDonate(stickyCampaign)}
                  disabled={donating}
                  className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  {donating ? t('donating') : t('donate_now')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!user && (
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">{t('login_required')}</h3>
            <p className="text-blue-700 mb-4">
              {t('login_to_access_full_features')}
            </p>
            <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              {t('login')}
            </Link>
          </div>
        </div>
      )}

      {currentUserRole && (
        <div className="mb-8">
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex overflow-x-auto space-x-8 pb-2 sticky top-0 bg-white z-10">
              <button
                onClick={() => setActiveTab('news')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'news'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Newspaper className="w-5 h-5" />
              </button>
              {canManage && (
                <button
                  onClick={() => setActiveTab('members')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                    activeTab === 'members'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setActiveTab('spaces')}
                className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                  activeTab === 'spaces'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Folder className="w-5 h-5" />
              </button>
              {user && (
                <button
                  onClick={() => router.push(`/organizations/${id}/donations`)}
                  className="py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                >
                  <Heart className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => router.push(`/organizations/${id}/news`)}
                className="py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                <Pencil className="w-5 h-5" />
              </button>
            </nav>
          </div>
        </div>
      )}

      {currentUserRole && (
        <div className="mb-8">
          {activeTab === 'members' && canManage && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">{t('members')} ({members.length})</h2>
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
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 max-w-md">
                    <input
                      type="text"
                      placeholder={t('search_users_by_name_or_email')}
                      value={inviteSearch}
                      onChange={(e) => setInviteSearch(e.target.value)}
                      className="flex-1 p-2 border rounded"
                    />
                    <button
                      onClick={() => handleSearchUsers(inviteSearch)}
                      className="px-4 py-2 bg-blue-600 text-white rounded whitespace-nowrap"
                    >
                      {t('search')}
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto">
                      {searchResults.map((u) => (
                        <div key={u.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-white rounded mb-1">
                          <span className="mb-1 sm:mb-0">{u.name} ({u.email})</span>
                          <button
                            onClick={() => handleInvite(u.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 self-start sm:self-auto"
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
                  <div key={member.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-4 rounded-lg shadow mb-2">
                    <div className="mb-2 sm:mb-0">
                      <span className="font-semibold">{member.name}</span> ({member.email})
                      <span className="ml-2 bg-gray-200 px-2 py-1 rounded text-sm">
                        {member.pivot?.role}
                      </span>
                    </div>
                    {currentUserRole === 'admin' && member.id !== user?.id && (
                      <div className="flex gap-2 flex-wrap">
                        <select
                          value={member.pivot?.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="p-1 border rounded text-sm"
                        >
                          <option value="author">{t('user_role_author')}</option>
                          <option value="editor">{t('user_role_editor')}</option>
                          <option value="admin">{t('user_role_admin')}</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">{t('spaces')} ({spaces.length})</h2>
                {currentUserRole === 'admin' && (
                  <button
                    onClick={() => setShowCreateSpace(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    {t('create_space')}
                  </button>
                )}
              </div>

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
                    <p className="text-gray-500">{t('no_spaces_found')}</p>
                  </div>
                ) : (
                  spaces.map(space => (
                    <div key={space.id} className="bg-white p-4 rounded-lg shadow mb-2 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push(`/organizations/${id}/spaces/${space.id}`)}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16">
                          {space.image ? (
                            <img src={space.image} alt={space.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
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
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
                <ul>
                  {news.map(item => (
                    <NewsItem key={item.public_id} news={item} hideOrganization={false} />
                  ))}
                </ul>
              )}
            </div>
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