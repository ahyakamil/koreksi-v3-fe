import { useState } from 'react'
import Router from 'next/router'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { login } from '../utils/api'


export default function Login(){
  const { setUser } = useAuth()
  const { t } = useLocale()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    const res = await login(email, password)
    if(res.ok && res.body && res.body.accessToken){
      const j = res.body
      if (setUser && j.user) setUser(j.user)
      Router.push('/')
    } else {
      setError(res.body?.message || (res.body?.errCode ? res.body.errCode : t('login_failed')))
    }
    setSubmitting(false)
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <img src="/icon-512x512.png" alt="Koreksi Logo" className="w-16 h-16 rounded-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('login')}</h1>
          <p className="text-gray-600 mt-2">{t('welcome_back')}</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('email_or_username')}
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder={t('enter_your_email_or_username')}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('password')}
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder={t('enter_your_password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
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
            {submitting ? t('loading') : t('login')}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-600">
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
              {t('forgot_password')}
            </Link>
          </p>
          <p className="text-gray-600">
            {t('dont_have_account')}{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              {t('sign_up')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
