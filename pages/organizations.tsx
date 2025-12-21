import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Organization } from '../types'
import { getOrganizations, getPublicOrganizations, createOrganization, updateOrganization, deleteOrganization, joinOrganization, leaveOrganization } from '../utils/api'
import OrganizationItem from '../components/OrganizationItem'
import OrganizationForm from '../components/OrganizationForm'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [publicOrganizations, setPublicOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my' | 'world'>('my')
  const [showForm, setShowForm] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const { user, loading: authLoading } = useAuth()
  const { t } = useLocale()
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    fetchOrganizations()
    fetchPublicOrganizations()
  }, [user, authLoading, router])

  const fetchOrganizations = async () => {
    const res = await getOrganizations()
    if (res.ok) {
      setOrganizations(res.body.data.organizations)
    }
    setLoading(false)
  }

  const fetchPublicOrganizations = async () => {
    const res = await getPublicOrganizations()
    if (res.ok) {
      setPublicOrganizations(res.body.data.organizations)
    }
  }

  const handleCreate = async (data: { title: string; description?: string; image?: string }) => {
    const res = await createOrganization(data)
    if (res.ok) {
      setOrganizations([...organizations, res.body.data.organization])
      setShowForm(false)
    } else {
      alert(res.body.message || t('failed_to_create_organization'))
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
      alert(res.body.message || t('failed_to_update_organization'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('are_you_sure_delete_organization'))) return
    const res = await deleteOrganization(id)
    if (res.ok) {
      setOrganizations(organizations.filter(org => org.id !== id))
    } else {
      alert(res.body.message || t('failed_to_delete_organization'))
    }
  }

  const handleJoin = async (id: string) => {
    const res = await joinOrganization(id)
    if (res.ok) {
      await fetchOrganizations()
      // Update public organizations to reflect the join
      setPublicOrganizations(publicOrganizations.map(org =>
        org.id === id ? { ...org, users: [...(org.users || []), { id: user!.id, name: user!.name, email: user!.email, pivot: { role: 'user' } }] } : org
      ))
    } else {
      alert(res.body.message || t('failed_to_join_organization'))
    }
  }

  const handleLeave = async (id: string) => {
    const res = await leaveOrganization(id)
    if (res.ok) {
      await fetchOrganizations()
      // Update public organizations to reflect the leave
      setPublicOrganizations(publicOrganizations.map(org =>
        org.id === id ? { ...org, users: (org.users || []).filter(u => u.id !== user!.id) } : org
      ))
    } else {
      alert(res.body.message || t('failed_to_leave_organization'))
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

  if (loading) return <div>{t('loading')}</div>

  const currentOrganizations = activeTab === 'my' ? organizations : publicOrganizations

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('organizations')}</h1>
        {activeTab === 'my' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {t('create_organization')}
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 ${activeTab === 'my' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            {t('my_organizations')}
          </button>
          <button
            onClick={() => setActiveTab('world')}
            className={`px-4 py-2 ${activeTab === 'world' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            {t('world_organizations')}
          </button>
        </div>
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
        {currentOrganizations.length === 0 ? (
          <p>{t('no_organizations_found')}</p>
        ) : (
          currentOrganizations.map(org => (
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