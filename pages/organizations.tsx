import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Organization } from '../types'
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization, joinOrganization, leaveOrganization } from '../utils/api'
import OrganizationItem from '../components/OrganizationItem'
import OrganizationForm from '../components/OrganizationForm'
import { useAuth } from '../context/AuthContext'

const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchOrganizations()
  }, [user, router])

  const fetchOrganizations = async () => {
    const res = await getOrganizations()
    if (res.ok) {
      setOrganizations(res.body.data.organizations)
    }
    setLoading(false)
  }

  const handleCreate = async (data: { title: string; description?: string; image?: string }) => {
    const res = await createOrganization(data)
    if (res.ok) {
      setOrganizations([...organizations, res.body.data.organization])
      setShowForm(false)
    } else {
      alert(res.body.message || 'Failed to create organization')
    }
  }

  const handleUpdate = async (data: { title: string; description?: string; image?: string }) => {
    if (!editingOrg) return
    const res = await updateOrganization(editingOrg.id, data)
    if (res.ok) {
      setOrganizations(organizations.map(org =>
        org.id === editingOrg.id ? res.body.data.organization : org
      ))
      setEditingOrg(null)
    } else {
      alert(res.body.message || 'Failed to update organization')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization?')) return
    const res = await deleteOrganization(id)
    if (res.ok) {
      setOrganizations(organizations.filter(org => org.id !== id))
    } else {
      alert(res.body.message || 'Failed to delete organization')
    }
  }

  const handleJoin = async (id: string) => {
    const res = await joinOrganization(id)
    if (res.ok) {
      await fetchOrganizations()
    } else {
      alert(res.body.message || 'Failed to join organization')
    }
  }

  const handleLeave = async (id: string) => {
    const res = await leaveOrganization(id)
    if (res.ok) {
      await fetchOrganizations()
    } else {
      alert(res.body.message || 'Failed to leave organization')
    }
  }

  const getCurrentUserRole = (org: Organization) => {
    return org.users?.find(u => u.id === user?.id)?.pivot?.role
  }

  const handleUpdateOrg = (updatedOrg: Organization) => {
    setOrganizations(organizations.map(org =>
      org.id === updatedOrg.id ? updatedOrg : org
    ))
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Organization
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <OrganizationForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {editingOrg && (
        <div className="mb-8">
          <OrganizationForm
            organization={editingOrg}
            onSubmit={handleUpdate}
            onCancel={() => setEditingOrg(null)}
          />
        </div>
      )}

      <div>
        {organizations.length === 0 ? (
          <p>No organizations found.</p>
        ) : (
          organizations.map(org => (
            <OrganizationItem
              key={org.id}
              organization={org}
              onEdit={setEditingOrg}
              onDelete={handleDelete}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onUpdate={handleUpdateOrg}
              currentUserRole={getCurrentUserRole(org)}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default OrganizationsPage