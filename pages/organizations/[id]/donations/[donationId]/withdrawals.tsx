import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Edit, Heart, DollarSign, Target, Calendar, Clock, ArrowLeft, Plus } from 'lucide-react'
import { DonationCampaign, Organization } from '../../../../../types'
import { getOrganization, getPublicOrganization, getDonationCampaign, checkOrganizationMembership, requestWithdrawal, getWithdrawalRequests } from '../../../../../utils/api'
import { formatCurrency, formatNumber } from '../../../../../utils/format'
import { useAuth } from '../../../../../context/AuthContext'
import { useLocale } from '../../../../../context/LocaleContext'

interface WithdrawalDetail {
  id: number
  fee_type: string
  requested_amount: number
  fee_amount: number
  received_amount: number
  created_at: string
  updated_at: string
}

interface WithdrawalRequest {
  id: number
  amount: number
  bank_name: string
  account_number: string
  account_holder_name: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string
  approved_at?: string
  requester: {
    id: string
    name: string
    email: string
  }
  approver?: {
    id: string
    name: string
    email: string
  }
  withdrawal_details: WithdrawalDetail[]
}

const WithdrawalsPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [campaign, setCampaign] = useState<DonationCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [memberRole, setMemberRole] = useState<string | null>(null)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [totalPendingAmount, setTotalPendingAmount] = useState(0)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false)
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    bank_name: '',
    account_number: '',
    account_holder_name: ''
  })
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

    // Fetch membership first
    const membershipRes = await checkOrganizationMembership(id as string)
    if (membershipRes.ok) {
      setMemberRole(membershipRes.body.data.role || null)
    } else {
      setMemberRole(null)
    }

    // Fetch organization (public)
    const orgRes = await getPublicOrganization(id as string)
    if (orgRes.ok) {
      setOrganization(orgRes.body.data.organization)
    }

    // Fetch campaign
    const campaignRes = await getDonationCampaign(id as string, donationId as string)
    if (campaignRes.ok) {
      setCampaign(campaignRes.body.data.campaign)
    } else {
      setCampaign(null)
    }

    // Fetch withdrawals
    await fetchWithdrawals()

    setLoading(false)
  }

  const fetchWithdrawals = async () => {
    if (!id || !donationId) return

    setWithdrawalsLoading(true)
    const withdrawalsRes = await getWithdrawalRequests(id as string, donationId as string, 0, 20)
    if (withdrawalsRes.ok) {
      setWithdrawals(withdrawalsRes.body.data.content || [])
      setAvailableBalance(withdrawalsRes.body.data.available_balance || 0)
      setTotalPendingAmount(withdrawalsRes.body.data.total_pending_amount || 0)
    }
    setWithdrawalsLoading(false)
  }

  const handleRequestWithdrawal = async () => {
    if (!organization || !campaign) return

    const amount = parseFloat(withdrawalForm.amount)
    if (isNaN(amount) || amount < 50000) {
      alert(t('minimum_withdrawal_amount') + ' ' + formatCurrency(50000))
      return
    }

    if (amount > availableBalance) {
      alert(t('insufficient_balance'))
      return
    }

    setRequestingWithdrawal(true)

    try {
      const res = await requestWithdrawal(organization.id, campaign.id, {
        amount,
        bank_name: withdrawalForm.bank_name,
        account_number: withdrawalForm.account_number,
        account_holder_name: withdrawalForm.account_holder_name
      })

      if (res.ok) {
        alert(t('withdrawal_request_submitted'))
        setWithdrawalForm({
          amount: '',
          bank_name: '',
          account_number: '',
          account_holder_name: ''
        })
        setShowCreateForm(false)
        await fetchWithdrawals()
      } else {
        if (res.status === 401) {
          alert(t('login_required'))
        } else if (res.status === 403) {
          alert(t('unauthorized'))
        } else {
          alert(res.body.message || t('failed_to_request_withdrawal'))
        }
      }
    } catch (error) {
      alert(t('withdrawal_request_error'))
    }

    setRequestingWithdrawal(false)
  }

  const canManage = memberRole === 'admin'

  if (loading) return <div>{t('loading')}</div>
  if (!organization || !campaign) return <div>{t('not_found')}</div>

  return (
    <>
      <Head>
        <title>{t('withdrawal_requests')} - {campaign.title} - {organization.title}</title>
      </Head>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <button
            onClick={() => router.push(`/organizations/${id}/donations/${donationId}`)}
            className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back_to_donation')}
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{t('withdrawal_requests')}</h1>
              <p className="text-gray-600 mt-2">{campaign.title} - {organization.title}</p>
            </div>
            {canManage && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('request_withdrawal')}
              </button>
            )}
          </div>
        </div>

        {/* Campaign Balance Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('campaign_balance')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">{t('total_balance')}</p>
              <div className="text-xl font-bold text-blue-600">
                Rp {formatNumber(campaign.current_amount || 0)}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('pending_withdrawals')}</p>
              <div className="text-xl font-bold text-orange-600">
                Rp {formatNumber(totalPendingAmount)}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('available_for_withdrawal')}</p>
              <div className="text-xl font-bold text-green-600">
                Rp {formatNumber(availableBalance)}
              </div>
            </div>
          </div>
        </div>

        {/* Create Withdrawal Request Form */}
        {canManage && showCreateForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <DollarSign className="w-5 h-5 text-green-500 mr-2" />
              {t('create_withdrawal_request')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('withdrawal_amount')} (Rp)
                </label>
                <input
                  type="number"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="50000"
                  min="50000"
                  step="1000"
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">{t('minimum_withdrawal')}: {formatCurrency(50000)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('bank_name')}
                </label>
                <input
                  type="text"
                  value={withdrawalForm.bank_name}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, bank_name: e.target.value }))}
                  placeholder="BCA"
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('account_number')}
                </label>
                <input
                  type="text"
                  value={withdrawalForm.account_number}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, account_number: e.target.value }))}
                  placeholder="1234567890"
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('account_holder_name')}
                </label>
                <input
                  type="text"
                  value={withdrawalForm.account_holder_name}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, account_holder_name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleRequestWithdrawal}
                disabled={requestingWithdrawal || !withdrawalForm.amount || !withdrawalForm.bank_name || !withdrawalForm.account_number || !withdrawalForm.account_holder_name}
                className="bg-green-500 text-white py-3 px-6 rounded hover:bg-green-600 disabled:opacity-50 flex items-center"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {requestingWithdrawal ? t('submitting') : t('submit_request')}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 text-white py-3 px-6 rounded hover:bg-gray-600"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Withdrawal Requests List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">{t('withdrawal_request_list')}</h2>
          {withdrawalsLoading ? (
            <p>{t('loading')}</p>
          ) : withdrawals.length > 0 ? (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-lg">{formatCurrency(withdrawal.amount)}</p>
                      <p className="text-sm text-gray-600">
                        {t('requested_by')}: {withdrawal.requester.name} ({withdrawal.requester.email})
                      </p>
                      <p className="text-sm text-gray-600">
                        {t('requested_on')}: {new Date(withdrawal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        withdrawal.status === 'approved' ? 'bg-green-100 text-green-800' :
                        withdrawal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {t(withdrawal.status)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>{t('bank_name')}:</strong> {withdrawal.bank_name}</p>
                      <p><strong>{t('account_number')}:</strong> {withdrawal.account_number}</p>
                      <p><strong>{t('account_holder_name')}:</strong> {withdrawal.account_holder_name}</p>
                    </div>
                    {withdrawal.notes && (
                      <div>
                        <p><strong>{t('notes')}:</strong> {withdrawal.notes}</p>
                      </div>
                    )}
                  </div>
                  {withdrawal.approved_at && withdrawal.approver && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>{t('approved_by')}: {withdrawal.approver.name} ({t('on')} {new Date(withdrawal.approved_at).toLocaleDateString()})</p>
                    </div>
                  )}
                  {withdrawal.withdrawal_details && withdrawal.withdrawal_details.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-semibold text-sm mb-2">{t('withdrawal_details')}</h4>
                      <div className="space-y-2">
                        {withdrawal.withdrawal_details.map((detail) => (
                          <div key={detail.id} className="bg-gray-50 p-3 rounded text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p><strong>{t('fee_type')}:</strong> {detail.fee_type}</p>
                                <p><strong>{t('requested_amount')}:</strong> {formatCurrency(detail.requested_amount)}</p>
                              </div>
                              <div>
                                <p><strong>{t('fee_amount')}:</strong> {formatCurrency(detail.fee_amount)}</p>
                                <p><strong>{t('received_amount')}:</strong> {formatCurrency(detail.received_amount)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">{t('no_withdrawal_requests')}</p>
          )}
        </div>
      </div>
    </>
  )
}

export default WithdrawalsPage