import { useState } from 'react'
import Router from 'next/router'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { updateProfile } from '../utils/api'
import { Layout } from '../components/Layout'

export default function Profile() {
  const { user, setUser } = useAuth()
  const { t } = useLocale()
  const [name, setName] = useState(user?.name || '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    const res = await updateProfile(name)
    if (res.ok) {
      setSuccess(t('profile_updated_successfully'))
      if (setUser && user) setUser({ ...user, name })
    } else {
      setError(res.body?.message || t('failed_to_update_profile'))
    }
    setSubmitting(false)
  }

  if (!user) {
    Router.push('/login')
    return null
  }

  return (
    <Layout showSidebar={false} showRightSidebar={false}>
      <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{t('profile')}</h1>
            <p className="text-gray-600 mt-2">Update your profile information</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('name')}
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder={t('enter_your_name')}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('email')}
              </label>
              <input
                type="email"
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                value={user.email}
              />
              <p className="text-sm text-gray-500 mt-1">{t('email_cannot_be_changed')}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitting ? t('loading') : t('update_profile')}
            </button>
          </form>
        </div>
    </Layout>
  )
}