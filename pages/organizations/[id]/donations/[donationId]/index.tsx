import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Script from 'next/script'
import { Edit, Heart, DollarSign, Target, Calendar, Users, Clock, Share2 } from 'lucide-react'
import { DonationCampaign, Organization } from '../../../../../types'
import { getOrganization, getDonationCampaign, donateToCampaign, getDonationTransactions } from '../../../../../utils/api'
import { formatCurrency, formatNumber } from '../../../../../utils/format'
import { useAuth } from '../../../../../context/AuthContext'
import { useLocale } from '../../../../../context/LocaleContext'

const DonationCampaignPage: React.FC<{ organization: Organization | null; campaign: DonationCampaign | null }> = ({ organization: initialOrganization, campaign: initialCampaign }) => {
  const [organization, setOrganization] = useState<Organization | null>(initialOrganization)
  const [campaign, setCampaign] = useState<DonationCampaign | null>(initialCampaign)
  const [loading, setLoading] = useState(true)
  const [donating, setDonating] = useState(false)
  const [donationAmount, setDonationAmount] = useState('')
  const [memberRole, setMemberRole] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const { user } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const { id, donationId } = router.query

  useEffect(() => {
    if (id && donationId) {
      fetchData()
    }
  }, [id, donationId])

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
      setCampaign(null)
    }

    // Fetch transactions
    setTransactionsLoading(true)
    const transactionsRes = await getDonationTransactions(id as string, donationId as string, 0, 10)
    if (transactionsRes.ok) {
      setTransactions(transactionsRes.body.data.content || [])
    }
    setTransactionsLoading(false)

    setLoading(false)
  }

  const handleDonate = async () => {
    if (!organization || !campaign || !donationAmount) return

    const amount = parseFloat(donationAmount)
    if (isNaN(amount) || amount < 50000) {
      alert(t('minimum_donation_amount') + ' ' + formatCurrency(50000))
      return
    }

    setDonating(true)

    try {
      const res = await donateToCampaign(organization.id, campaign.id, amount)
      if (res.ok) {
        const { snap_token, order_id } = res.body.data
        // Integrate with Midtrans Snap.js
        if ((window as any).snap) {
          (window as any).snap.pay(snap_token, {
            onSuccess: function(result: any) {
              alert('Payment success!')
              fetchData()
              setDonationAmount('')
            },
            onPending: function(result: any) {
              alert('Payment pending!')
            },
            onError: function(result: any) {
              alert('Payment failed!')
            },
            onClose: function() {
              alert('Payment popup closed!')
            }
          })
        } else {
          alert('Midtrans Snap not loaded')
        }
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
    <>
      <Head>
        <title>{campaign.title} - {organization.title}</title>
        <meta name="description" content={campaign.description || `Support ${campaign.title} by ${organization.title}`} />
        <meta property="og:title" content={campaign.title} />
        <meta property="og:description" content={campaign.description || `Support ${campaign.title} by ${organization.title}`} />
        <meta property="og:image" content={organization.image || '/default-image.jpg'} />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={campaign.title} />
        <meta name="twitter:description" content={campaign.description || `Support ${campaign.title} by ${organization.title}`} />
        <meta name="twitter:image" content={organization.image || '/default-image.jpg'} />
      </Head>
      <Script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} />
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
          <div className="flex gap-2">
            {canManage ? (
              <Link
                href={`/organizations/${id}/donations/${donationId}/edit`}
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 inline-flex items-center"
                title={t('edit_campaign')}
              >
                <Edit className="w-4 h-4" />
              </Link>
            ) : (
              <div
                className="bg-gray-300 text-white p-2 rounded inline-flex items-center opacity-50 cursor-not-allowed"
                title={t('edit_campaign')}
              >
                <Edit className="w-4 h-4" />
              </div>
            )}
            <button
              onClick={() => {
                const title = campaign.title
                const text = campaign.description || `Support ${campaign.title} by ${organization.title}`
                if (navigator.share) {
                  navigator.share({
                    title,
                    text,
                    url: window.location.href,
                  }).catch(() => {
                  })
                }
              }}
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600 inline-flex items-center"
              title={t('share')}
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
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
                  <p className="font-semibold">{campaign.created_at && !isNaN(new Date(campaign.created_at).getTime()) ? new Date(campaign.created_at).toLocaleDateString() : 'N/A'}</p>
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
                <span>Rp {formatNumber(campaign.current_amount || 0)} / Rp {formatNumber(campaign.target_amount || 0)}</span>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Donation Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Heart className="w-5 h-5 text-red-500 mr-2" />
              {t('make_a_donation')}
            </h2>
            {user ? (
              campaign.is_active && !campaign.is_expired ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('donation_amount')} (Rp)
                    </label>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="50000"
                      min="50000"
                      step="1000"
                      className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('minimum_donation')}: {formatCurrency(50000)}</p>
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
              ) : (
                <p className="text-gray-500">{t('campaign_not_active')}</p>
              )
            ) : (
              <div className="text-center">
                <p className="text-gray-700 mb-4">{t('login_to_donate')}</p>
                <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  {t('login')}
                </Link>
              </div>
            )}
          </div>

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

          {/* Donation Transactions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">{t('recent_donations')}</h2>
            {transactionsLoading ? (
              <p>{t('loading')}</p>
            ) : transactions.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                    <div>
                      <p className="font-medium">{transaction.transaction?.user?.name || 'Anonymous'}</p>
                    </div>
                    <p className="font-semibold text-green-600">{formatCurrency(transaction.amount)}</p>
                  </div>
                ))}
                {transactions.length > 5 && (
                  <p className="text-xs text-gray-500 text-center mt-2">And {transactions.length - 5} more...</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">{t('no_donations_yet')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default DonationCampaignPage

export async function getServerSideProps(context: any) {
  const { id, donationId } = context.params

  // Fetch organization (public)
  const orgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${id}/public`)
  let organization = null
  if (orgRes.ok) {
    const orgData = await orgRes.json()
    organization = orgData.data.organization
  }

  // Fetch campaign
  const campaignRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${id}/donations/${donationId}`)
  let campaign = null
  if (campaignRes.ok) {
    const campaignData = await campaignRes.json()
    campaign = campaignData.data.campaign
  }

  return {
    props: {
      organization,
      campaign,
    },
  }
}