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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('organizations')}</h1>
              <p className="mt-1 text-sm text-gray-600">
                {activeTab === 'my' ? t('manage_your_organizations') : t('discover_organizations_worldwide')}
              </p>
            </div>
            {activeTab === 'my' && (
              <button
                onClick={() => { setShowForm(true); setEditingOrg(null); }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors md:px-4"
                aria-label={t('create_organization')}
              >
                <svg className="h-5 w-5 md:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden md:inline">{t('create_organization')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('my')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('my_organizations')}
              </button>
              <button
                onClick={() => { setActiveTab('world'); setShowForm(false); setEditingOrg(null); }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'world'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('world_organizations')}
              </button>
            </nav>
          </div>
        </div>

        {/* Forms */}
        {showForm && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
            <OrganizationForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {editingOrg && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
            <OrganizationForm
              organization={editingOrg}
              onSubmit={handleUpdate}
              onCancel={() => setEditingOrg(null)}
            />
          </div>
        )}

        {/* Organizations Grid */}
        <div>
          {currentOrganizations.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('no_organizations_found')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'my' ? t('get_started_create_first_organization') : t('no_organizations_available')}
              </p>
            </div>
          ) : (
            <div>
              {currentOrganizations.map(org => (
                <OrganizationItem
                  key={org.id}
                  organization={org}
                  onEdit={(org) => { setEditingOrg(org); setShowForm(false); }}
                  onDelete={handleDelete}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  onUpdate={handleUpdateOrg}
                />
              ))}
            </div>
          )}

          {/* Loading/Infinite Scroll Indicator */}
          <div className="mt-8 text-center">
            {loadingMore ? (
              <div className="inline-flex items-center px-4 py-2 text-sm text-gray-500">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('loading')}
              </div>
            ) : (
              currentPageable && currentPageable.pageNumber + 1 >= currentPageable.totalPages && currentOrganizations.length > 0 && (
                <p className="text-sm text-gray-500">{t('no_more')}</p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrganizationsPage