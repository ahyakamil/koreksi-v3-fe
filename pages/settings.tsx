import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { updatePassword } from '../utils/api'
import { Layout } from '../components/Layout'

export default function Settings() {
  const { user, loading } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSuccess(null)
    if (password !== passwordConfirmation) {
      setError(t('passwords_do_not_match'))
      return
    }
    setSubmitting(true)
    const res = await updatePassword(currentPassword, password, passwordConfirmation)
    if (res.ok) {
      setSuccess(t('password_updated_successfully'))
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
    } else {
      setError(res.body?.message || t('failed_to_update_password'))
    }
    setSubmitting(false)
  }

  if (loading || !user) {
    return (
      <Layout showSidebar={false} showRightSidebar={false}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-gray-500">{t('loading')}</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout showSidebar={false} showRightSidebar={false}>
      <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
            <p className="text-gray-600 mt-2">Update your password</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('current_password')}
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder={t('enter_your_current_password')}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('new_password')}
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder={t('enter_your_new_password')}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('confirm_new_password')}
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder={t('confirm_your_new_password')}
                value={passwordConfirmation}
                onChange={e => setPasswordConfirmation(e.target.value)}
              />
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
              {submitting ? t('loading') : t('update_password')}
            </button>
          </form>
        </div>
    </Layout>
  )
}