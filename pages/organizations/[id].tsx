import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Organization, User } from '../../types'
import { getOrganization, updateUserRole, removeMember, inviteUser, searchUsers } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const OrganizationDetailsPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteSearch, setInviteSearch] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showInvite, setShowInvite] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id && user) {
      fetchOrganization()
    }
  }, [id, user])

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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Members ({organization.users?.length})</h2>
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
    </div>
  )
}

export default OrganizationDetailsPage