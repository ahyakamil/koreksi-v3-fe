import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { X, Check, Clock, User, DollarSign, Calendar, CreditCard, Receipt } from 'lucide-react'
import { Subscription, SubscriptionWithdrawalRequest, Organization } from '../../../../types'
import { getOrganization, getOrganizationSubscriptions, getOrganizationSubscriptionWithdrawalRequests, adminCancelSubscription, handleSubscriptionWithdrawalRequest, adminCreateWithdrawalRequest, getOrganizationCurrentAmount, checkOrganizationMembership } from '../../../../utils/api'
import { formatNumber } from '../../../../utils/format'
import { useAuth } from '../../../../context/AuthContext'
import { useLocale } from '../../../../context/LocaleContext'

const SubscriptionsPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [withdrawalRequests, setWithdrawalRequests] = useState<SubscriptionWithdrawalRequest[]>([])
  const [currentAmount, setCurrentAmount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [memberRole, setMemberRole] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('subscriptions')
  const [showCreateWithdrawal, setShowCreateWithdrawal] = useState(false)
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    bank_name: '',
    account_number: '',
    account_holder_name: ''
  })
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
      const membershipRes = await checkOrganizationMembership(id as string)
      if (membershipRes.ok) {
        setMemberRole(membershipRes.body.data.role || null)
      } else {
        setMemberRole(null)
      }
    }

    // Fetch subscriptions
    const subsRes = await getOrganizationSubscriptions(id as string)
    if (subsRes.ok) {
      setSubscriptions(subsRes.body.data.content)
    }

    // Fetch current amount
    const amountRes = await getOrganizationCurrentAmount(id as string)
    if (amountRes.ok) {
      setCurrentAmount(amountRes.body.data.current_amount || 0)
    }

    // Fetch withdrawal requests
    const wrRes = await getOrganizationSubscriptionWithdrawalRequests(id as string)
    if (wrRes.ok) {
      setWithdrawalRequests(wrRes.body.data.content)
    }

    setLoading(false)
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!organization) return
    if (!confirm('Are you sure you want to cancel this subscription?')) return

    const res = await adminCancelSubscription(organization.id, subscriptionId)
    if (res.ok) {
      setSubscriptions(subscriptions.map(sub =>
        sub.id === subscriptionId ? { ...sub, status: 'cancelled' } : sub
      ))
    } else {
      alert(res.body.message || 'Failed to cancel subscription')
    }
  }

  const handleCreateWithdrawalRequest = async () => {
    if (!organization) return

    const amount = parseFloat(withdrawalForm.amount)
    if (amount < 50000) {
      alert('Minimum withdrawal amount is Rp 50,000')
      return
    }

    const totalPendingAmount = withdrawalRequests
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0)

    if (amount + totalPendingAmount > currentAmount) {
      alert('Insufficient balance. Current amount is Rp ' + formatNumber(currentAmount) + ', pending withdrawals: Rp ' + formatNumber(totalPendingAmount))
      return
    }

    const res = await adminCreateWithdrawalRequest(organization.id, {
      amount,
      bank_name: withdrawalForm.bank_name,
      account_number: withdrawalForm.account_number,
      account_holder_name: withdrawalForm.account_holder_name
    })

    if (res.ok) {
      setWithdrawalRequests([...withdrawalRequests, res.body.data.withdrawal_request])
      setShowCreateWithdrawal(false)
      setWithdrawalForm({
        amount: '',
        bank_name: '',
        account_number: '',
        account_holder_name: ''
      })
    } else {
      alert(res.body.message || 'Failed to create withdrawal request')
    }
  }

  const canManage = memberRole === 'admin'

  if (loading) return <div>{t('loading')}</div>
  if (!organization) return <div>{t('organization_not_found')}</div>
  if (!canManage) return <div>{t('unauthorized')}</div>

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <button
          onClick={() => router.push(`/organizations/${id}`)}
          className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm sm:text-base"
        >
          {t('back_to_organization')}
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold">Manage Subscriptions - {organization.title}</h1>
      </div>

      {/* Current Amount */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-center">
          <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
          <span className="text-lg font-semibold text-blue-800">Current Amount: Rp {formatNumber(currentAmount)}</span>
        </div>
      </div>

      {/* Withdrawal Summary */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Withdrawal Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Pending Requests</p>
              <div className="text-xl font-bold text-orange-600">
                {withdrawalRequests.filter(r => r.status === 'pending').length}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pending Amount</p>
              <div className="text-xl font-bold text-orange-600">
                Rp {formatNumber(withdrawalRequests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Available for Withdrawal</p>
              <div className="text-xl font-bold text-green-600">
                Rp {formatNumber(currentAmount - withdrawalRequests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subscriptions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className="w-5 h-5 inline mr-2" />
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'withdrawals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Receipt className="w-5 h-5 inline mr-2" />
              Withdrawal Requests
            </button>
          </nav>
        </div>
      </div>

      {/* Subscriptions Section */}
      {activeTab === 'subscriptions' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Active Subscriptions</h2>
          <div className="space-y-4">
            {subscriptions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No active subscriptions found</p>
              </div>
            ) : (
              subscriptions.map(subscription => (
                <div key={subscription.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <span className="text-lg sm:text-xl font-semibold">{subscription.user?.name}</span>
                        {subscription.status === 'active' && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs sm:text-sm self-start sm:self-auto">
                            Active
                          </span>
                        )}
                        {subscription.status === 'pending' && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs sm:text-sm self-start sm:self-auto">
                            Pending
                          </span>
                        )}
                        {subscription.status === 'cancelled' && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs sm:text-sm self-start sm:self-auto">
                            Cancelled
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 flex-shrink-0" />
                          Amount: Rp {formatNumber(subscription.amount || 0)}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                          Expires: {new Date(subscription.end_date).toLocaleDateString()}
                        </span>
                        <span>Plan: {subscription.plan}</span>
                      </div>
                    </div>
                    {subscription.status === 'pending' && (
                      <div className="flex gap-2 self-start sm:self-auto">
                        <button
                          onClick={() => handleCancelSubscription(subscription.id)}
                          className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-sm flex items-center justify-center min-w-[80px]"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Withdrawal Requests Section */}
      {activeTab === 'withdrawals' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Withdrawal Requests</h2>
            <button
              onClick={() => setShowCreateWithdrawal(!showCreateWithdrawal)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {showCreateWithdrawal ? 'Cancel' : 'Create Withdrawal Request'}
            </button>
          </div>

          {showCreateWithdrawal && (
            <div className="mb-8 p-4 bg-gray-50 rounded">
              <h3 className="text-lg font-semibold mb-4">Create Withdrawal Request</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (Minimum: Rp 50,000)</label>
                  <input
                    type="number"
                    value={withdrawalForm.amount}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="50000"
                    min="50000"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={withdrawalForm.bank_name}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, bank_name: e.target.value }))}
                    placeholder="Bank Name"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Number</label>
                  <input
                    type="number"
                    value={withdrawalForm.account_number}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, account_number: e.target.value }))}
                    placeholder="Account Number"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={withdrawalForm.account_holder_name}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, account_holder_name: e.target.value }))}
                    placeholder="Account Holder Name"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleCreateWithdrawalRequest}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Create Request
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {withdrawalRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No withdrawal requests found</p>
              </div>
            ) : (
              withdrawalRequests.map(request => (
                <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-lg">Rp {formatNumber(request.amount)}</p>
                      <p className="text-sm text-gray-600">
                        Requested by: {request.requester?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Requested on: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Bank Name:</strong> {request.bank_name}</p>
                      <p><strong>Account Number:</strong> {request.account_number}</p>
                      <p><strong>Account Holder Name:</strong> {request.account_holder_name}</p>
                    </div>
                  </div>
                  {request.approved_at && request.approver && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Approved by: {request.approver.name} (on {new Date(request.approved_at).toLocaleDateString()})</p>
                    </div>
                  )}
                  {request.withdrawal_details && request.withdrawal_details.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-semibold text-sm mb-2">Withdrawal Details</h4>
                      <div className="space-y-2">
                        {request.withdrawal_details.map((detail) => (
                          <div key={detail.id} className="bg-gray-50 p-3 rounded text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p><strong>Fee Type:</strong> {detail.fee_type}</p>
                                <p><strong>Requested Amount:</strong> Rp {formatNumber(detail.requested_amount)}</p>
                              </div>
                              <div>
                                <p><strong>Fee Amount:</strong> Rp {formatNumber(detail.fee_amount)}</p>
                                <p><strong>Received Amount:</strong> Rp {formatNumber(detail.received_amount)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {request.amount < 50000 && (
                    <div className="mt-2 text-red-600 text-sm">
                      Amount below minimum (Rp 50,000)
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionsPage