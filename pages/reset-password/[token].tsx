import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useLocale } from '../../context/LocaleContext'
import { resetPassword } from '../../utils/api'

export default function ResetPassword(){
  const { t } = useLocale()
  const router = useRouter()
  const { token, email } = router.query
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    if (submitting) return
    if (password !== passwordConfirmation) {
      setError('Passwords do not match')
      return
    }
    setError(null)
    setSubmitting(true)
    const res = await resetPassword(email as string, token as string, password, passwordConfirmation)
    if(res.ok){
      setSuccess(true)
    } else {
      setError(res.body?.message || 'Failed to reset password')
    }
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('password_reset_success')}</h1>
          <p className="text-gray-600 mb-6">Your password has been reset successfully</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            {t('back_to_login')}
          </Link>
        </div>
      </div>
    )
  }

  if (!token || !email) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('invalid_reset_link')}</h1>
          <p className="text-gray-600 mb-6">The reset link is invalid or expired</p>
          <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
            {t('forgot_password')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <img src="/icon-512x512.png" alt="Koreksi Logo" className="w-16 h-16 rounded-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reset_password')}</h1>
          <p className="text-gray-600 mt-2">Enter your new password</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('enter_new_password')}
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder={t('enter_new_password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('confirm_password')}
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder={t('confirm_password')}
              value={passwordConfirmation}
              onChange={e => setPasswordConfirmation(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {submitting ? t('loading') : t('reset_password')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              {t('back_to_login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}