import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Organization } from '../../../../types'
import { getOrganization, createDonationCampaign, checkOrganizationMembership } from '../../../../utils/api'
import { useAuth } from '../../../../context/AuthContext'
import { useLocale } from '../../../../context/LocaleContext'
import { Back } from '@/components/Back'

const CreateDonationPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [memberRole, setMemberRole] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    sticky: false,
    end_date: '',
    is_active: true
  })
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

    const res = await getOrganization(id as string)
    if (res.ok) {
      setOrganization(res.body.data.organization)
      const membershipRes = await checkOrganizationMembership(id as string)
      if (membershipRes.ok) {
        setMemberRole(membershipRes.body.data.role || null)
      } else {
        setMemberRole(null)
      }
    } else {
      alert(res.body.message || t('failed_to_load_organization'))
      router.push('/organizations')
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization) return

    setSubmitting(true)
    const res = await createDonationCampaign(organization.id, {
      title: formData.title,
      description: formData.description || undefined,
      target_amount: formData.target_amount ? parseFloat(formData.target_amount) : undefined,
      sticky: formData.sticky,
      end_date: formData.end_date || undefined,
      is_active: formData.is_active
    })

    if (res.ok) {
      router.push(`/organizations/${id}/donations`)
    } else {
      alert(res.body.message || t('failed_to_create_donation'))
    }
    setSubmitting(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const canManage = memberRole === 'admin'

  if (loading) return <div>{t('loading')}</div>
  if (!organization) return <div>{t('organization_not_found')}</div>
  if (!canManage) return <div>{t('unauthorized')}</div>

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Back />
        <h1 className="text-3xl font-bold">{t('create_donation')} - {organization.title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('title')} *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('description')}
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('target_amount')} (Rp)
          </label>
          <input
            type="number"
            name="target_amount"
            value={formData.target_amount}
            onChange={handleChange}
            onKeyDown={(e) => { if (e.key === '.') e.preventDefault(); }}
            min="0"
            step="1"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('end_date')}
          </label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">{t('is_active')}</span>
          </label>
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="sticky"
              checked={formData.sticky}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">{t('make_sticky')}</span>
          </label>
          <p className="text-sm text-gray-500 mt-1">
            {t('sticky_donation_description')}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {submitting ? t('creating') : t('create_donation')}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/organizations/${id}/donations`)}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateDonationPage