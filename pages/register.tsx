import { useState } from 'react'
import Router from 'next/router'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { register, setCookie } from '../utils/api'


export default function Register(){
  const { setUser } = useAuth()
  const { t } = useLocale()
  const [name,setName]=useState('')
  const [username,setUsername]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [errors,setErrors]=useState<{[key: string]: string} | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    if (submitting) return
    setErrors(null)
    setSubmitting(true)
    const res = await register(name, username, email, password)
    if(res.ok && res.body && res.body.accessToken){
      const j = res.body
      setCookie('s_user', j.accessToken)
      if (setUser && j.user) setUser(j.user)
      Router.push('/')
    } else {
      if (res.body?.errors) {
        setErrors(res.body.errors)
      } else {
        setErrors({ general: res.body?.message || (res.body?.errCode ? res.body.errCode : 'Register failed') })
      }
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
          <h1 className="text-2xl font-bold text-gray-900">{t('register')}</h1>
          <p className="text-gray-600 mt-2">{t('create_your_account')}</p>
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
              {t('username')}
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder={t('enter_your_username')}
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('email')}
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder={t('enter_your_email')}
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

          {errors && (
            <div className="space-y-2">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {errors.general}
                </div>
              )}
              {errors.username && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {t('username_label')}: {Array.isArray(errors.username) ? errors.username[0] : errors.username}
                </div>
              )}
              {errors.email && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {t('email_label')}: {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                </div>
              )}
              {errors.name && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {t('name_label')}: {Array.isArray(errors.name) ? errors.name[0] : errors.name}
                </div>
              )}
              {errors.password && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {t('password_label')}: {Array.isArray(errors.password) ? errors.password[0] : errors.password}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {submitting ? t('loading') : t('register')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t('already_have_account')}{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              {t('login')}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
