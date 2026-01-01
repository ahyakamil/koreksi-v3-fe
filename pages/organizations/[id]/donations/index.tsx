import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Plus, Edit, Trash2, Coins, Target, Calendar } from 'lucide-react'
import { DonationCampaign, Organization } from '../../../../types'
import { getOrganization, getDonationCampaigns, deleteDonationCampaign } from '../../../../utils/api'
import { formatNumber } from '../../../../utils/format'
import { useAuth } from '../../../../context/AuthContext'
import { useLocale } from '../../../../context/LocaleContext'

const DonationsPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [memberRole, setMemberRole] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id && user) {
      fetchData()
    }
  }, [id, user])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, authLoading, router])

  const fetchData = async () => {
    if (!id) return

    // Fetch organization
    const orgRes = await getOrganization(id as string)
    if (orgRes.ok) {
      setOrganization(orgRes.body.data.organization)
      // Check member role
      const role = orgRes.body.data.organization.users?.find((u: any) => u.id === user?.id)?.pivot?.role
      setMemberRole(role || null)
    }

    // Fetch campaigns
    const campaignsRes = await getDonationCampaigns(id as string)
    if (campaignsRes.ok) {
      setCampaigns(campaignsRes.body.data.content)
    }

    setLoading(false)
  }

  const handleDelete = async (campaignId: string) => {
    if (!organization) return
    if (!confirm(t('are_you_sure_delete_campaign'))) return

    const res = await deleteDonationCampaign(organization.id, campaignId)
    if (res.ok) {
      setCampaigns(campaigns.filter(c => c.id !== campaignId))
    } else {
      if (res.status === 401) {
        alert(t('login_required'))
      } else if (res.status === 403) {
        alert(t('unauthorized'))
      } else {
        alert(res.body.message || t('failed_to_delete_campaign'))
      }
    }
  }

  const canManage = memberRole === 'admin'

  if (loading) return <div>{t('loading')}</div>
  if (!organization) return <div>{t('organization_not_found')}</div>

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <button
          onClick={() => router.push(`/organizations/${id}`)}
          className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm sm:text-base"
        >
          {t('back_to_organization')}
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold">{t('donation_campaigns')} - {organization.title}</h1>
        {!canManage && (
          <p className="text-gray-600 mt-2 text-sm sm:text-base">{t('viewing_as_guest')}</p>
        )}
      </div>

      {canManage && (
        <div className="mb-6">
          <Link
            href={`/organizations/${id}/donations/create`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-flex items-center text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('create_campaign')}
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('no_campaigns_found')}</p>
          </div>
        ) : (
          campaigns.map(campaign => (
            <div key={campaign.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                     <Link
                       href={`/organizations/${id}/donations/${campaign.id}`}
                       className="text-lg sm:text-xl font-semibold text-blue-600 hover:text-blue-800 hover:underline break-words"
                     >
                       {campaign.title}
                     </Link>
                     {campaign.is_active && (
                       <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs sm:text-sm self-start sm:self-auto">
                         {t('active')}
                       </span>
                     )}
                   </div>
                  {campaign.description && (
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">{campaign.description}</p>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <span className="flex items-center">
                      <Coins className="w-4 h-4 mr-1 flex-shrink-0" />
                      {t('collected')}: Rp {formatNumber(campaign.current_amount || 0)}
                    </span>
                    {campaign.target_amount && (
                      <span className="flex items-center">
                        <Target className="w-4 h-4 mr-1 flex-shrink-0" />
                        {t('target')}: Rp {formatNumber(campaign.target_amount || 0)}
                      </span>
                    )}
                    {campaign.end_date && (
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                        {t('end_date')}: {new Date(campaign.end_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {campaign.target_amount && (
                    <div className="mt-3 sm:mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(((campaign.current_amount || 0) / (campaign.target_amount || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(((campaign.current_amount || 0) / (campaign.target_amount || 1)) * 100)}% {t('completed')}
                      </p>
                    </div>
                  )}
                </div>
                {canManage && (
                  <div className="flex gap-2 self-start sm:self-auto">
                    <Link
                      href={`/organizations/${id}/donations/${campaign.id}/edit`}
                      className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm flex items-center justify-center min-w-[40px]"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-sm flex items-center justify-center min-w-[40px]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default DonationsPage