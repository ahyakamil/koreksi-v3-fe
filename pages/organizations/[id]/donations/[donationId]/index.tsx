import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Edit, Heart, DollarSign, Target, Calendar, Users, Clock } from 'lucide-react'
import { DonationCampaign, Organization, DonationTransaction } from '../../../../../types'
import { getOrganization, getDonationCampaign, donateToCampaign } from '../../../../../utils/api'
import { useAuth } from '../../../../../context/AuthContext'
import { useLocale } from '../../../../../context/LocaleContext'

const DonationCampaignPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [campaign, setCampaign] = useState<DonationCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [donating, setDonating] = useState(false)
  const [donationAmount, setDonationAmount] = useState('')
  const [memberRole, setMemberRole] = useState<string | null>(null)
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

    // Fetch campaign
    const campaignRes = await getDonationCampaign(id as string, donationId as string)
    if (campaignRes.ok) {
      setCampaign(campaignRes.body.data.campaign)
    } else {
      alert(t('campaign_not_found'))
      router.push(`/organizations/${id}/donations`)
    }

    setLoading(false)
  }

  const handleDonate = async () => {
    if (!organization || !campaign || !donationAmount) return

    const amount = parseFloat(donationAmount)
    if (isNaN(amount) || amount < 1000) {
      alert(t('minimum_donation_amount'))
      return
    }

    setDonating(true)

    try {
      const res = await donateToCampaign(organization.id, campaign.id, amount)
      if (res.ok) {
        const { snap_token, order_id } = res.body.data
        // In production, integrate with Midtrans Snap.js
        alert(`${t('payment_initiated')}! ${t('order_id')}: ${order_id}`)
        // Refresh campaign data
        fetchData()
        setDonationAmount('')
      } else {
        if (res.status === 401) {
          alert(t('login_required'))
        } else if (res.status === 403) {
          alert(t('unauthorized'))
        } else {
          alert(res.body.message || t('failed_to_initiate_payment'))
        }
      }
    } catch (error) {
      alert(t('payment_error'))
    }

    setDonating(false)
  }

  const canManage = memberRole === 'admin'

  if (loading) return <div>{t('loading')}</div>
  if (!organization || !campaign) return <div>{t('not_found')}</div>

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <button
          onClick={() => router.push(`/organizations/${id}/donations`)}
          className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          {t('back_to_donations')}
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            <p className="text-gray-600 mt-2">{t('by')} {organization.title}</p>
          </div>
          {canManage && (
            <Link
              href={`/organizations/${id}/donations/${donationId}/edit`}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              {t('edit_campaign')}
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Campaign Description */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">{t('about_this_campaign')}</h2>
            {campaign.description ? (
              <p className="text-gray-700 whitespace-pre-wrap">{campaign.description}</p>
            ) : (
              <p className="text-gray-500 italic">{t('no_description')}</p>
            )}
          </div>

          {/* Campaign Stats */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">{t('campaign_details')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-purple-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">{t('created')}</p>
                  <p className="font-semibold">{new Date(campaign.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {campaign.end_date && (
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-red-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">{t('ends')}</p>
                    <p className="font-semibold">{new Date(campaign.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {campaign.target_amount && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('progress')}</h2>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(((campaign.current_amount || 0) / (campaign.target_amount || 1)) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{Math.round(((campaign.current_amount || 0) / (campaign.target_amount || 1)) * 100)}% {t('completed')}</span>
                <span>Rp {(campaign.current_amount || 0).toLocaleString()} / Rp {(campaign.target_amount || 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Recent Donations */}
          {campaign.transactions && campaign.transactions.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">{t('recent_donations')}</h2>
              <div className="space-y-3">
                {campaign.transactions.slice(0, 10).map((transaction: DonationTransaction) => (
                  <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium">{transaction.user?.name}</p>
                      <p className="text-sm text-gray-500">{new Date(transaction.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className="font-semibold text-green-600">Rp {transaction.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              {campaign.transactions.length > 10 && (
                <p className="text-center text-gray-500 mt-4">
                  {t('and_more', { count: campaign.transactions.length - 10 })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Donation Form */}
          {user && campaign.is_active && !campaign.is_expired && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Heart className="w-5 h-5 text-red-500 mr-2" />
                {t('make_a_donation')}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('donation_amount')} (Rp)
                  </label>
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    placeholder="10000"
                    min="1000"
                    step="1000"
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('minimum_donation')}: Rp 1,000</p>
                </div>
                <button
                  onClick={handleDonate}
                  disabled={donating || !donationAmount}
                  className="w-full bg-red-500 text-white py-3 px-4 rounded hover:bg-red-600 disabled:opacity-50 flex items-center justify-center"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {donating ? t('processing') : t('donate_now')}
                </button>
              </div>
            </div>
          )}

          {/* Campaign Status */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">{t('campaign_status')}</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${campaign.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">
                  {campaign.is_active ? t('active') : t('inactive')}
                </span>
              </div>
              {campaign.end_date && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm">
                    {campaign.is_expired ? t('expired') : t('ends_on', { date: new Date(campaign.end_date).toLocaleDateString() })}
                  </span>
                </div>
              )}
              {campaign.target_amount && (campaign.current_amount || 0) >= campaign.target_amount && (
                <div className="flex items-center">
                  <Target className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm text-green-600 font-medium">{t('target_reached')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DonationCampaignPage