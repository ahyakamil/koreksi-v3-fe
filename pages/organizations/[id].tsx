import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Organization, User, Space, News } from '../../types'
import { getOrganization, updateUserRole, removeMember, inviteUser, searchUsers, getSpaces, getNews, createSpace, updateSpace, deleteSpace, reviewNews } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import SpaceForm from '../../components/SpaceForm'

const OrganizationDetailsPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteSearch, setInviteSearch] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showInvite, setShowInvite] = useState(false)
  const [activeTab, setActiveTab] = useState('members')
  const [spaces, setSpaces] = useState<Space[]>([])
  const [news, setNews] = useState<News[]>([])
  const [showCreateSpace, setShowCreateSpace] = useState(false)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id && user) {
      fetchOrganization()
    }
  }, [id, user])

  useEffect(() => {
    if (organization && activeTab === 'spaces') {
      fetchSpaces()
    } else if (organization && activeTab === 'news') {
      fetchNews()
    }
  }, [organization, activeTab])

  const fetchOrganization = async () => {
    if (!id) return
    const res = await getOrganization(id as string)
    if (res.ok) {
      setOrganization(res.body.data.organization)
    } else {
      alert(res.body.message || 'Failed to load organization')
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
    const res = await getNews(id as string)
    if (res.ok) {
      setNews(res.body.data.news)
    }
  }

  const handleCreateSpace = async (data: { name: string; description?: string; image?: string }) => {
    if (!organization) return
    const res = await createSpace(organization.id, data)
    if (res.ok) {
      setSpaces([...spaces, res.body.data.space])
      setShowCreateSpace(false)
    } else {
      alert(res.body.message || 'Failed to create space')
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
    if (!confirm('Are you sure you want to delete this space?')) return
    const res = await deleteSpace(organization.id, spaceId)
    if (res.ok) {
      setSpaces(spaces.filter(s => s.id !== spaceId))
    } else {
      alert(res.body.message || 'Failed to delete space')
    }
  }

  const handleReviewNews = async (newsId: string, action: 'publish' | 'reject') => {
    if (!organization) return
    let reviewNotes: string | undefined = undefined
    if (action === 'reject') {
      const notes = prompt('Enter rejection reason:')
      if (!notes) return
      reviewNotes = notes
    }

    const res = await reviewNews(organization.id, newsId, { action, review_notes: reviewNotes })
    if (res.ok) {
      fetchNews() // Refresh the news list
    } else {
      alert(res.body.message || 'Failed to review news')
    }
  }

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    if (!organization) return
    const res = await updateUserRole(organization.id, targetUserId, newRole)
    if (res.ok) {
      setOrganization(res.body.data.organization)
    } else {
      alert(res.body.message || 'Failed to update role')
    }
  }

  const handleRemoveMember = async (targetUserId: string) => {
    if (!organization) return
    if (!confirm('Are you sure you want to remove this member?')) return
    const res = await removeMember(organization.id, targetUserId)
    if (res.ok) {
      setOrganization(res.body.data.organization)
    } else {
      alert(res.body.message || 'Failed to remove member')
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
      alert(res.body.message || 'Failed to invite user')
    }
  }

  const getCurrentUserRole = () => {
    return organization?.users?.find(u => u.id === user?.id)?.pivot?.role
  }

  if (loading) return <div>Loading...</div>
  if (!organization) return <div>Organization not found</div>

  const currentUserRole = getCurrentUserRole()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.push('/organizations')}
          className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Organizations
        </button>
        <h1 className="text-3xl font-bold">{organization.title}</h1>
        {organization.description && (
          <p className="text-gray-600 mt-2">{organization.description}</p>
        )}
        {organization.image && (
          <img src={organization.image} alt={organization.title} className="w-full h-48 object-cover rounded-lg mt-4" />
        )}
      </div>

      <div className="mb-8">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('members')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Members ({organization.users?.length})
            </button>
            {currentUserRole && (
              <>
                <button
                  onClick={() => setActiveTab('spaces')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'spaces'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Spaces
                </button>
                <button
                  onClick={() => router.push(`/organizations/${id}/news`)}
                  className="py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                >
                  Manage News
                </button>
              </>
            )}
          </nav>
        </div>

        {activeTab === 'members' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Members</h2>
              {currentUserRole === 'admin' && (
                <button
                  onClick={() => setShowInvite(!showInvite)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Invite User
                </button>
              )}
            </div>

        {showInvite && (
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <input
              type="text"
              placeholder="Search users by name or email"
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
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

            <div>
              {organization.users?.map((member) => (
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
                        <option value="user">User</option>
                        <option value="author">Author</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'spaces' && currentUserRole && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Spaces</h2>
              {currentUserRole === 'admin' && (
                <button
                  onClick={() => setShowCreateSpace(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Create Space
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
                <p>No spaces found.</p>
              ) : (
                spaces.map(space => (
                  <div key={space.id} className="bg-white p-4 rounded-lg shadow mb-2">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {space.image ? (
                          <img src={space.image} alt={space.name} className="w-16 h-16 object-cover rounded-lg" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No image</span>
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
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSpace(space.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            Delete
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

      </div>
    </div>
  )
}

export default OrganizationDetailsPage