import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Organization, DonationCampaign } from '../../../../../types'
import { getOrganization, getDonationCampaign, updateDonationCampaign } from '../../../../../utils/api'
import { useAuth } from '../../../../../context/AuthContext'
import { useLocale } from '../../../../../context/LocaleContext'

const EditDonationPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [donation, setDonation] = useState<DonationCampaign | null>(null)
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
  const { id, donationId } = router.query

  useEffect(() => {
    if (id && donationId && user) {
      fetchData()
    }
  }, [id, donationId, user])

  const fetchData = async () => {
    if (!id || !donationId) return

    // Fetch organization
    const orgRes = await getOrganization(id as string)
    if (orgRes.ok) {
      setOrganization(orgRes.body.data.organization)
      const role = orgRes.body.data.organization.users?.find((u: any) => u.id === user?.id)?.pivot?.role
      setMemberRole(role || null)
    }

    // Fetch donation
    const donationRes = await getDonationCampaign(id as string, donationId as string)
    if (donationRes.ok) {
      const donationData = donationRes.body.data.campaign
      setDonation(donationData)
      setFormData({
        title: donationData.title,
        description: donationData.description || '',
        target_amount: donationData.target_amount?.toString() || '',
        sticky: donationData.sticky,
        end_date: donationData.end_date ? new Date(donationData.end_date).toISOString().split('T')[0] : '',
        is_active: donationData.is_active
      })
    } else {
      if (donationRes.status === 401) {
        alert(t('login_required'))
      } else if (donationRes.status === 403) {
        alert(t('unauthorized'))
      } else {
        alert(t('donation_not_found'))
      }
      router.push(`/organizations/${id}/donations`)
    }

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization || !donation) return

    setSubmitting(true)
    const res = await updateDonationCampaign(organization.id, donation.id, {
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
      if (res.status === 401) {
        alert(t('login_required'))
      } else if (res.status === 403) {
        alert(t('unauthorized'))
      } else {
        alert(res.body.message || t('failed_to_update_donation'))
      }
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
  if (!organization || !donation) return <div>{t('not_found')}</div>

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <button
          onClick={() => router.push(`/organizations/${id}/donations`)}
          className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          {t('back_to_donations')}
        </button>
        <h1 className="text-3xl font-bold">{t('edit_donation')} - {organization.title}</h1>
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
            {t('target_amount')}
          </label>
          <input
            type="number"
            name="target_amount"
            value={formData.target_amount}
            onChange={handleChange}
            min="0.01"
            step="0.01"
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
            {submitting ? t('updating') : t('update_donation')}
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

export default EditDonationPage