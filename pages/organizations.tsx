import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Organization, Pageable } from '../types'
import { getOrganizations, getAllOrganizations, createOrganization, updateOrganization, deleteOrganization, joinOrganization, leaveOrganization } from '../utils/api'
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
  const [myPageable, setMyPageable] = useState<Pageable | null>(null)
  const [worldPageable, setWorldPageable] = useState<Pageable | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deletedOrgIds, setDeletedOrgIds] = useState<Set<string>>(new Set())
  const { user, loading: authLoading } = useAuth()
  const { t } = useLocale()
  const router = useRouter()

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000) // Hide after 3 seconds
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    fetchOrganizations(0)
    fetchPublicOrganizations(0)
  }, [user, authLoading, router])

  // Infinite scroll effect
  useEffect(() => {
    const currentPageable = activeTab === 'my' ? myPageable : worldPageable
    const handleScroll = () => {
      if (loadingMore || !currentPageable) return
      const hasMore = (currentPageable.pageNumber + 1) < currentPageable.totalPages
      if (!hasMore) return
      if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 400)) {
        if (activeTab === 'my') {
          fetchOrganizations(currentPageable.pageNumber + 1)
        } else {
          fetchPublicOrganizations(currentPageable.pageNumber + 1)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [myPageable, worldPageable, loadingMore, activeTab])

  // Reload data when switching tabs
  useEffect(() => {
    if (activeTab === 'my') {
      fetchOrganizations(0)
    } else {
      fetchPublicOrganizations(0)
    }
  }, [activeTab])

  const fetchOrganizations = async (pageToLoad = 0) => {
    if (pageToLoad > 0) { setLoadingMore(true) }
    const res = await getOrganizations(pageToLoad, 10)
    if (res.ok && res.body.data.content) {
      if (pageToLoad === 0) {
        setOrganizations(res.body.data.content)
      } else {
        setOrganizations(prev => [...prev, ...res.body.data.content])
      }
      setMyPageable(res.body.data.pageable)
    }
    setLoading(false)
    setLoadingMore(false)
  }

  const fetchPublicOrganizations = async (pageToLoad = 0) => {
    if (pageToLoad > 0) { setLoadingMore(true) }
    const res = await getAllOrganizations(pageToLoad, 10)
    if (res.ok && res.body.data.content) {
      if (pageToLoad === 0) {
        setPublicOrganizations(res.body.data.content)
      } else {
        setPublicOrganizations(prev => [...prev, ...res.body.data.content])
      }
      setWorldPageable(res.body.data.pageable)
    }
    setLoadingMore(false)
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
      // Hide the card immediately
      setDeletedOrgIds(prev => new Set(prev).add(id))
      showSuccessMessage('Organization deleted successfully!')
    } else {
      alert(res.body.message || t('failed_to_delete_organization'))
    }
  }

  const handleJoin = async (id: string) => {
    const res = await joinOrganization(id)
    if (res.ok) {
      // Update public organizations immediately to show Leave button
      setPublicOrganizations(publicOrganizations.map(org =>
        org.id === id ? { ...org, my_role: 'user' } : org
      ))
      await fetchOrganizations() // Refresh personal organizations
      showSuccessMessage('Successfully joined the organization!')
    } else {
      alert(res.body.message || t('failed_to_join_organization'))
    }
  }

  const handleLeave = async (id: string) => {
    const res = await leaveOrganization(id)
    if (res.ok) {
      // Update public organizations immediately to show Join button
      setPublicOrganizations(publicOrganizations.map(org =>
        org.id === id ? { ...org, my_role: null } : org
      ))
      await fetchOrganizations() // Refresh personal organizations
      showSuccessMessage('Successfully left the organization!')
    } else {
      alert(res.body.message || t('failed_to_leave_organization'))
    }
  }


  const handleUpdateOrg = (updatedOrg: Organization) => {
    setOrganizations(organizations.map(org =>
      org.id === updatedOrg.id ? updatedOrg : org
    ))
  }

  if (loading) return <div>{t('loading')}</div>

  const currentOrganizations = (activeTab === 'my' ? organizations : publicOrganizations)
    .filter(org => !deletedOrgIds.has(org.id))
  const currentPageable = activeTab === 'my' ? myPageable : worldPageable

  return (
    <div>
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('organizations')}</h1>
        {activeTab === 'my' && (
          <button
            onClick={() => { setShowForm(true); setEditingOrg(null); }}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 sm:py-2"
            aria-label={t('create_organization')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
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
            onClick={() => { setActiveTab('world'); setShowForm(false); setEditingOrg(null); }}
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
              onEdit={(org) => { setEditingOrg(org); setShowForm(false); }}
              onDelete={handleDelete}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onUpdate={handleUpdateOrg}
            />
          ))
        )}
        <div className="mt-4 text-center text-sm text-gray-600">
          {loadingMore ? t('loading') : (currentPageable && currentPageable.pageNumber + 1 >= currentPageable.totalPages ? t('no_more') || 'No more organizations' : '')}
        </div>
      </div>
    </div>
  )
}

export default OrganizationsPage